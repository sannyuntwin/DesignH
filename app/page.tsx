import DesignCanvas from '../components/DesignCanvas'
import TopNavigation from '../components/TopNavigation'
import LeftSidebar from '../components/LeftSidebar'
import CanvasToolbar from '../components/CanvasToolbar'
import BottomPreview from '../components/BottomPreview'

export default function Home() {
  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Navigation */}
      <TopNavigation />
      
      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <LeftSidebar />
        
        {/* Canvas Area */}
        <div className="flex-1 flex flex-col">
          {/* Canvas Toolbar */}
          <CanvasToolbar />
          
          {/* Canvas Container */}
          <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
            <div className="bg-white rounded-lg shadow-lg">
              <DesignCanvas width={800} height={600} />
            </div>
          </div>
          
          {/* Bottom Preview */}
          <BottomPreview />
        </div>
      </div>
    </div>
  )
}
