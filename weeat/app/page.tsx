import Header from "./Header";
import Catalog from "./Catalog/Catalog";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen font-['Poppins']">
      <Header />
      <main className="flex-grow bg-gray-50">
        <Catalog />
      </main>
    </div>
  );
}