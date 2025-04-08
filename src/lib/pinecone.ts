import { Pinecone, PineconeRecord } from "@pinecone-database/pinecone";
import { downloadFromS3 } from "./s3-server";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import md5 from "md5";
import {
  RecursiveCharacterTextSplitter,
  Document,
} from "@pinecone-database/doc-splitter";
import { getEmbeddings } from "./embeddings";
import { convertToAscii } from "./utils";

let pinecone: Pinecone | null = null;

export const getPineconeClient = async () => {
  if (!pinecone) {
    pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
  }
  return pinecone;
};

type PDFPage = {
  pageContent: string;
  metadata: {
    loc: { pageNumber: number };
  };
};

export async function loadS3IntoPinecone(fileKey: string) {
  //  1.obtain the pdf -> download from S3 and read
  console.log("downloading S3 into file system");
  const file_name = await downloadFromS3(fileKey);
  if (!file_name) {
    throw new Error("Error downloading file from S3");
  }
  const loader = new PDFLoader(file_name);
  const pages = (await loader.load()) as PDFPage[];

  // 2. split and segment the pdf
  const documents = await Promise.all(pages.map(prepareDocument));

  // 3. vectorise and embed individual documents
  const vectors = await Promise.all(documents.flat().map(embedDocument));
  const validVectors = vectors.filter(vector => vector !== null) as PineconeRecord[];

  // 4. upload vectors to pinecone
  const client = await getPineconeClient();
  const pineconeIndex = client.Index("chatpdf");
  const namespace = convertToAscii(fileKey);

  console.log("uploading vectors to pinecone");

  const chunks = (vectors: PineconeRecord[], batchSize = 100) => {
    const chunks = [];
    for (let i = 0; i < vectors.length; i += batchSize) {
      chunks.push(vectors.slice(i, i + batchSize));
    }
    return chunks;
  };

  if (validVectors.length === 0) {
    console.log("no valid vectors to upload");
    return documents[0];
  }
  for (const chunk of chunks(validVectors)) {
    await pineconeIndex.namespace(namespace).upsert(chunk);
  }
  
  return documents[0];
}

async function embedDocument(doc: Document) {
  try {
    const embeddings = await getEmbeddings(doc.pageContent);
    if (!embeddings || embeddings.length === 0) {
      console.log("no embeddings found");
      return null;
    }
    const hash = md5(doc.pageContent);

    return {
      id: hash,
      values: embeddings,
      metadata: {
        text: doc.metadata.text,
        pageNumber: doc.metadata.pageNumber,
      },
    } as PineconeRecord;
  } catch (error) {
    console.log("error embedding document", error);
    throw error;
  }
}

export const truncateStringByBytes = (str: string, maxBytes: number) => {
  const encoder = new TextEncoder();
  return new TextDecoder("utf-8").decode(
    encoder.encode(str).slice(0, maxBytes)
  );
};

async function prepareDocument(page: PDFPage) {
  let { pageContent, metadata } = page;
  pageContent = pageContent.replace(/\n/g, " ");
  const splitter = new RecursiveCharacterTextSplitter();
  const docs = await splitter.splitDocuments([
    new Document({
      pageContent,
      metadata: {
        pageNumber: metadata.loc.pageNumber,
        text: truncateStringByBytes(pageContent, 36000),
      },
    }),
  ]);
  return docs;
}
