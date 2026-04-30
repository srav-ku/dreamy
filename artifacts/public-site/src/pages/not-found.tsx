import { Link } from "wouter";
import { Layout } from "@/components/layout";

export default function NotFound() {
  return (
    <Layout title="Not Found">
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <h1 className="text-[#71767b] text-base mb-6">Hmm...this page doesn't exist. Try searching for something else.</h1>
        <Link 
          href="/" 
          className="bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white font-bold py-3 px-8 rounded-full transition-colors"
        >
          Go to Home
        </Link>
      </div>
    </Layout>
  );
}
