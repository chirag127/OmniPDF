import { ReactNode } from 'react';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-blue-600 text-white shadow-md">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold">OmniPDF</h1>
            <span className="ml-2 text-sm bg-blue-700 px-2 py-1 rounded">Beta</span>
          </div>
          <nav>
            <ul className="flex space-x-6">
              <li><a href="/" className="hover:text-blue-200">Home</a></li>
              <li><a href="/tools" className="hover:text-blue-200">Tools</a></li>
              <li><a href="/about" className="hover:text-blue-200">About</a></li>
            </ul>
          </nav>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      
      <footer className="bg-gray-800 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p>&copy; {new Date().getFullYear()} OmniPDF. All rights reserved.</p>
            </div>
            <div className="flex space-x-4">
              <a href="/privacy" className="hover:text-blue-300">Privacy Policy</a>
              <a href="/terms" className="hover:text-blue-300">Terms of Service</a>
              <a href="/contact" className="hover:text-blue-300">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
