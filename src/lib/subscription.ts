import { auth } from "@clerk/nextjs/server"
import { db } from "./db"
import { userSubsriptions } from "./db/schema"
import { eq } from "drizzle-orm"

const DAY_IN_MS = 1000 * 60 * 60 * 24

export const checkSubscription = async () => {
    const { userId } = await auth()
    if (!userId) return false

    const _userSubscription = await db
    .select()
    .from(userSubsriptions)
    .where(eq(userSubsriptions.userId, userId))

    if (!_userSubscription[0]) return false

    const userSubscription = _userSubscription[0]

    const isValid = userSubscription.stripePriceId && userSubscription.stripeCurrentPeriodEnd?.getTime()! + 86_400_000 > Date.now()

    return !!isValid
}