import { RegisterForm } from '@/components/auth/RegisterForm'
import { Navbar } from '@/components/homepage/Navbar'

export default function RegisterPage() {
  return (
    <>
      <Navbar />
      <div className="flex min-h-screen items-center justify-center px-4 pt-16">
        <RegisterForm />
      </div>
    </>
  )
}
