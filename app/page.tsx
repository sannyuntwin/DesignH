'use client'

// Landing page for DesignPro
// Shows overview and navigation to main features

import Link from 'next/link'
import {
  Palette,
  Layout,
  Image,
  Type,
  Zap,
  Users,
  Star,
  ArrowRight,
  CheckCircle,
  Sparkles,
} from 'lucide-react'
import AuthButton from '@/components/auth/AuthButton'
import AuthGuard from '@/components/auth/AuthGuard'

export default function LandingPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-xl">🎨</span>
                </div>
                <span className="ml-3 font-display text-xl text-slate-900">DesignPro</span>
              </div>
              <nav className="flex items-center space-x-6">
                <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</Link>
                <Link href="/templates" className="text-gray-600 hover:text-gray-900">Templates</Link>
                <AuthButton />
              </nav>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Professional Design
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">
                {' '}Made Simple
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Create stunning designs with our powerful editor. From social media posts to presentations, 
                  DesignPro has everything you need to bring your ideas to life.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/editor"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Layout className="w-5 h-5" />
                Start Creating
              </Link>
              <Link
                href="/templates"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200"
              >
                <Image className="w-5 h-5" />
                Browse Templates
              </Link>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything You Need</h2>
              <p className="text-lg text-gray-600">Professional tools for every design need</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard
                icon={<Palette className="w-6 h-6" />}
                title="Advanced Design Tools"
                description="Professional-grade editing with layers, effects, and precision controls"
              />
              <FeatureCard
                icon={<Type className="w-6 h-6" />}
                title="Text Effects & Typography"
                description="Curved text, gradients, shadows, and hundreds of fonts to choose from"
              />
              <FeatureCard
                icon={<Image className="w-6 h-6" />}
                title="Stock Photos & Assets"
                description="Access thousands of professional images and design elements"
              />
              <FeatureCard
                icon={<Zap className="w-6 h-6" />}
                title="Magic Resize"
                description="Instantly resize your designs for any platform or format"
              />
              <FeatureCard
                icon={<Users className="w-6 h-6" />}
                title="Team Collaboration"
                description="Work together in real-time with comments and shared workspaces"
              />
              <FeatureCard
                icon={<Star className="w-6 h-6" />}
                title="Brand Kits"
                description="Maintain brand consistency with custom colors, fonts, and logos"
              />
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Get Started Now</h2>
              <p className="text-lg text-gray-600">Choose how you want to create</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <ActionCard
                title="Start from Scratch"
                description="Create a new design with a blank canvas"
                icon={<Layout className="w-8 h-8" />}
                href="/editor"
                color="blue"
              />
              <ActionCard
                title="Use Templates"
                description="Browse professional templates to get started fast"
                icon={<Image className="w-8 h-8" />}
                href="/templates"
                color="green"
              />
              <ActionCard
                title="View Dashboard"
                description="Manage your existing designs and projects"
                icon={<Palette className="w-8 h-8" />}
                href="/dashboard"
                color="purple"
              />
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-xl">🎨</span>
              </div>
              <span className="ml-3 font-display text-xl">DesignPro</span>
            </div>
            <p className="text-gray-400">Professional Design Editor</p>
          </div>
        </footer>
      </div>
    </AuthGuard>
  )
}

// Feature Card Component
interface FeatureCardProps {
  icon: React.ReactNode
  title: string
  description: string
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
      <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  )
}

// Action Card Component
interface ActionCardProps {
  title: string
  description: string
  icon: React.ReactNode
  href: string
  color: 'blue' | 'green' | 'purple'
}

function ActionCard({ title, description, icon, href, color }: ActionCardProps) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
    green: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
    purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
  }

  return (
    <Link
      href={href}
      className={`block p-8 bg-gradient-to-br ${colorClasses[color]} text-white rounded-xl transition-all duration-200 hover:shadow-xl hover:scale-105`}
    >
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-white/20 rounded-lg flex items-center justify-center mb-4">
          {icon}
        </div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-white/90">{description}</p>
        <div className="flex items-center gap-2 mt-4">
          <span className="text-sm font-medium">Get Started</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </Link>
  )
}
