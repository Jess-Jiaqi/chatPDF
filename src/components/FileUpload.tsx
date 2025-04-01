'use client'
import { uploadToS3 } from '@/lib/s3'
import { Inbox } from 'lucide-react'
import React from 'react'
import { useDropzone } from 'react-dropzone'


const FileUpload = () => {
  const { getRootProps, getInputProps } = useDropzone({
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      console.log(acceptedFiles)
      const file = acceptedFiles[0]
      if (file.size > 10 * 1024 * 1024) {
        alert('please upload a file less than 10mb')
        return
      }
      try {
        const data = await uploadToS3(file)
        console.log('data', data)
      } catch (error) {
        console.log(error)
      }
    }
  })

  return (
    <div className='p-2 bg-white rounded-xl'>
      <div {...getRootProps({
        className: 'border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-80 py-8 flex justify-center items-center flex-col'
      })} >
        <input {...getInputProps()} />
        <>
          <Inbox className='w-10 h-10 text-blue-700' />
          <p className='mt-2 text-sm text-slate-500'>Drop PDF here</p>
        </>
      </div>
    </div>
  )
}

export default FileUpload