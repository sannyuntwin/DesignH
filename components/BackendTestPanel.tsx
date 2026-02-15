'use client'

import { useState } from 'react'
import { KeyboardShortcutsHelp } from './KeyboardShortcuts'

interface TestResult {
  name: string
  status: 'passed' | 'failed' | 'pending'
  details: string
  data?: any
}

export default function BackendTestPanel() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [summary, setSummary] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'tests' | 'shortcuts'>('tests')

  const runBackendTests = async () => {
    setIsRunning(true)
    setTestResults([])
    setSummary(null)

    try {
      const response = await fetch('/api/test-backend')
      const data = await response.json()

      if (response.ok) {
        setTestResults(data.tests)
        setSummary(data.summary)
      } else {
        setTestResults([{
          name: 'API Call',
          status: 'failed',
          details: data.error || 'Failed to run tests'
        }])
      }
    } catch (error) {
      setTestResults([{
        name: 'API Connection',
        status: 'failed',
        details: error instanceof Error ? error.message : 'Network error'
      }])
    } finally {
      setIsRunning(false)
    }
  }

  const testAutoSave = async () => {
    try {
      // Trigger a save action by simulating canvas changes
      const event = new CustomEvent('canvas:save', {
        detail: { test: true, timestamp: Date.now() }
      })
      window.dispatchEvent(event)

      alert('Auto-save test triggered! Check the console for results.')
    } catch (error) {
      alert('Auto-save test failed: ' + (error instanceof Error ? error.message : 'Unknown error'))
    }
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-gray-100">
        Backend Testing Panel
      </h2>

      {/* Tab Navigation */}
      <div className="flex p-1 bg-gray-100 dark:bg-gray-700 rounded-lg mb-4">
        <button
          onClick={() => setActiveTab('tests')}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'tests'
              ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Backend Tests
        </button>
        <button
          onClick={() => setActiveTab('shortcuts')}
          className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'shortcuts'
              ? 'bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          Keyboard Shortcuts
        </button>
      </div>

      {activeTab === 'tests' && (
        <div className="space-y-4">
        <div className="flex gap-4">
          <button
            onClick={runBackendTests}
            disabled={isRunning}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isRunning ? 'Running Tests...' : 'Run Backend Tests'}
          </button>

          <button
            onClick={testAutoSave}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            Test Auto-Save
          </button>
        </div>

        {summary && (
          <div className={`p-4 rounded-lg ${
            summary.success ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'
          }`}>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Test Summary
            </h3>
            <div className="text-sm text-gray-700 dark:text-gray-300">
              <p>Total: {summary.total}</p>
              <p>Passed: {summary.passed}</p>
              <p>Failed: {summary.failed}</p>
              <p>Status: {summary.success ? '✅ All Tests Passed' : '❌ Some Tests Failed'}</p>
            </div>
          </div>
        )}

        {testResults.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              Test Results
            </h3>
            {testResults.map((test, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border ${
                  test.status === 'passed' 
                    ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800'
                    : test.status === 'failed'
                    ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
                    : 'bg-gray-50 border-gray-200 dark:bg-gray-700/20 dark:border-gray-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {test.name}
                  </span>
                  <span className={`text-sm font-semibold ${
                    test.status === 'passed' ? 'text-green-600 dark:text-green-400' :
                    test.status === 'failed' ? 'text-red-600 dark:text-red-400' :
                    'text-gray-600 dark:text-gray-400'
                  }`}>
                    {test.status === 'passed' ? '✅' : 
                     test.status === 'failed' ? '❌' : '⏳'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {test.details}
                </p>
                {test.data && (
                  <details className="mt-2">
                    <summary className="text-xs text-gray-500 dark:text-gray-500 cursor-pointer">
                      View Data
                    </summary>
                    <pre className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded mt-1 overflow-auto">
                      {JSON.stringify(test.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Manual Testing Steps
          </h3>
          <ol className="text-sm text-gray-700 dark:text-gray-300 space-y-1 list-decimal list-inside">
            <li>Add shapes to the canvas</li>
            <li>Modify properties (colors, sizes)</li>
            <li>Wait for auto-save (check console logs)</li>
            <li>Refresh the page to test data persistence</li>
            <li>Check browser's Network tab for API calls</li>
            <li>Verify Supabase dashboard for new records</li>
          </ol>
        </div>
      </div>
      )}

      {activeTab === 'shortcuts' && (
        <KeyboardShortcutsHelp />
      )}
    </div>
  )
}
