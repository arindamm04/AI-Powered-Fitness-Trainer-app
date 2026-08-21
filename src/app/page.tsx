"use client"
import { useAuth, SignInButton, SignOutButton } from "@clerk/nextjs";

const Homepage = () => {
  const { isSignedIn } = useAuth();

  return (
  <div>
    Homepage
    {!isSignedIn && <SignInButton />}
    {isSignedIn && <SignOutButton />}
  </div>
  )
}
export default Homepage;