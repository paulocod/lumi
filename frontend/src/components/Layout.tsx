import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  Home,
  FileText,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Faturas', href: '/invoices', icon: FileText },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-lumi-gray-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white shadow-sm border-b border-lumi-gray-200">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center">
              <button
                type="button"
                className="lg:hidden -m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-lumi-gray-700 hover:bg-lumi-green-50"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              >
                {isSidebarOpen ? (
                  <X className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="h-6 w-6" aria-hidden="true" />
                )}
              </button>
              <div className="ml-4 lg:ml-0">
                <h1 className="text-xl font-bold text-lumi-green-800">Lumi</h1>
              </div>
            </div>
            <div className="flex items-center gap-x-4">
              <span className="text-sm font-medium text-lumi-gray-700">{user?.name}</span>
              <button
                onClick={logout}
                className="text-lumi-gray-700 hover:text-lumi-gray-900 hover:bg-lumi-green-50 p-2 rounded-full transition-colors duration-200"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-30 w-64 transform transition-transform duration-200 ease-in-out lg:translate-x-0 pt-16 hidden lg:block">
        <div className="h-full bg-white border-r border-lumi-gray-200">
          <nav className="flex flex-col h-full overflow-y-auto px-3 py-4">
            <div className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
                      isActive(item.href)
                        ? 'bg-lumi-green-50 text-lumi-green-700'
                        : 'text-lumi-gray-700 hover:bg-lumi-green-50 hover:text-lumi-green-700'
                    }`}
                  >
                    <Icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-200 ${
                        isActive(item.href)
                          ? 'text-lumi-green-700'
                          : 'text-lumi-gray-400 group-hover:text-lumi-green-700'
                      }`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-20 bg-lumi-gray-800 bg-opacity-50 lg:hidden" onClick={() => setIsSidebarOpen(false)}>
          <div className="fixed inset-y-0 left-0 z-30 w-64 bg-white transform transition-transform duration-200 ease-in-out translate-x-0 pt-16">
            <nav className="flex flex-col h-full overflow-y-auto px-3 py-4">
              <div className="space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`group flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
                        isActive(item.href)
                          ? 'bg-lumi-green-50 text-lumi-green-700'
                          : 'text-lumi-gray-700 hover:bg-lumi-green-50 hover:text-lumi-green-700'
                      }`}
                      onClick={() => setIsSidebarOpen(false)}
                    >
                      <Icon
                        className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-200 ${
                          isActive(item.href)
                            ? 'text-lumi-green-700'
                            : 'text-lumi-gray-400 group-hover:text-lumi-green-700'
                        }`}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="lg:pl-64 pt-16">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
