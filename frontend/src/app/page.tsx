import { Header } from "@/components/Header";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Own Your Digital Land
          </h1>
          <p className="mt-5 max-w-xl mx-auto text-xl text-gray-500">
            Claim, trade, and manage digital land parcels using what3words addresses on the blockchain.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              href="/claim"
              className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Claim Land
            </Link>
            <Link
              href="/my-lands"
              className="ml-3 inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50"
            >
              View My Lands
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
