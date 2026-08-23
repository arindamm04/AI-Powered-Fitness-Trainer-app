'use client'

import { useEffect } from 'react'
import { useConvexAuth, useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'

/**
 * Ensures the signed-in Clerk user has a row in the Convex `users` table.
 * The Clerk webhook only fires on sign-up, so this covers sign-in as well as
 * any delivery that failed. The mutation is idempotent.
 */
export default function StoreUser() {
    const { isAuthenticated } = useConvexAuth()
    const storeUser = useMutation(api.users.store)

    useEffect(() => {
        if (!isAuthenticated) return
        storeUser().catch((err) => console.error('Failed to store user:', err))
    }, [isAuthenticated, storeUser])

    return null
}
