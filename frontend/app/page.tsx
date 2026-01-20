import CanvasEditor from '@/components/canvas-editor';
import Toolbar from '@/components/toolbar';
import PropertiesPanel from '@/components/properties-panel';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">DesignH</h1>
        <p className="text-sm text-gray-600">Create beautiful designs with our intuitive editor</p>
      </header>
      
      <main className="flex h-[calc(100vh-73px)]">
        {/* Toolbar */}
        <aside className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
          <Toolbar />
        </aside>
        
        {/* Canvas Area */}
        <div className="flex-1 flex items-center justify-center p-8">
          <CanvasEditor />
        </div>
        
        {/* Properties Panel */}
        <aside className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
          <PropertiesPanel />
        </aside>
      </main>
    </div>
  );
}
