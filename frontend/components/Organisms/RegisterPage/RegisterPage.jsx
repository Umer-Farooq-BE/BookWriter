import AuthFormSignUp from "@/Components/Molecules/AuthFormSignUp";
import Link from "next/link";

export default function SignupPage() {
  return (
    <div className="flex  my-4 md:mt-8 h-full  w-full items-start pt-12 md:pt-0 md:items-center justify-center bg-background ">
      <div className="w-full max-w-md overflow-hidden rounded-2xl flex flex-col gap-12">
        <div className="flex flex-col items-center justify-center gap-2 px-4 text-center sm:px-16">
          <h3 className="text-xl font-semibold dark:text-zinc-50">
            Sign Up with free trial
          </h3>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Empower your creativity with a free trial of our platform. Sign up
            now to get started!
          </p>
        </div>

        <AuthFormSignUp />
        <p className="text-center text-sm text-gray-600 dark:text-zinc-400">
          {"Already have an account? "}
          <Link
            href="/login"
            className="font-semibold text-gray-800 hover:underline dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
          >
            Sign in
          </Link>
          {" to continue."}
        </p>
      </div>
    </div>
  );
}
