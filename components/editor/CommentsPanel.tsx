'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageSquare, Send, X, Check, Reply, Pin, Trash2, User, Clock } from 'lucide-react'

interface Comment {
  id: string
  design_id: string
  user_id: string
  content: string
  x_coordinate?: number
  y_coordinate?: number
  parent_id?: string
  resolved: boolean
  created_at: string
  updated_at: string
  user_name: string
  email: string
  replies?: Comment[]
}

interface CommentsPanelProps {
  isOpen: boolean
  onClose: () => void
  designId: string
  canvasRef?: React.RefObject<HTMLCanvasElement>
}

interface CommentPin {
  id: string
  x: number
  y: number
  comment: Comment
}

export default function CommentsPanel({ isOpen, onClose, designId, canvasRef }: CommentsPanelProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [showResolved, setShowResolved] = useState(false)
  const [commentPins, setCommentPins] = useState<CommentPin[]>([])
  const [selectedComment, setSelectedComment] = useState<string | null>(null)
  const [isAddingComment, setIsAddingComment] = useState(false)
  const [pendingPosition, setPendingPosition] = useState<{ x: number; y: number } | null>(null)
  const commentEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen) {
      fetchComments()
    }
  }, [isOpen, showResolved])

  useEffect(() => {
    if (commentEndRef.current) {
      commentEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [comments])

  const fetchComments = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/designs/${designId}/comments?resolved=${showResolved}`)
      const data = await response.json()
      
      if (data.comments) {
        // Organize comments into threads
        const organizedComments = organizeComments(data.comments)
        setComments(organizedComments)
        
        // Create pins for unresolved comments with coordinates
        const pins = data.comments
          .filter((comment: Comment) => !comment.resolved && comment.x_coordinate && comment.y_coordinate)
          .map((comment: Comment) => ({
            id: comment.id,
            x: comment.x_coordinate!,
            y: comment.y_coordinate!,
            comment
          }))
        setCommentPins(pins)
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const organizeComments = (flatComments: Comment[]): Comment[] => {
    const commentMap = new Map<string, Comment>()
    const rootComments: Comment[] = []

    // First pass: create comment map
    flatComments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] })
    })

    // Second pass: organize into threads
    flatComments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.id)!
      
      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id)
        if (parent) {
          parent.replies!.push(commentWithReplies)
        }
      } else {
        rootComments.push(commentWithReplies)
      }
    })

    return rootComments
  }

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isAddingComment || !canvasRef?.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    setPendingPosition({ x, y })
    setNewComment('')
  }

  const addComment = async () => {
    if (!newComment.trim()) return

    try {
      const userId = 'demo-user' // Replace with actual user ID
      const payload: any = {
        user_id: userId,
        content: newComment
      }

      if (pendingPosition) {
        payload.x_coordinate = pendingPosition.x
        payload.y_coordinate = pendingPosition.y
      }

      const response = await fetch(`/api/designs/${designId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const data = await response.json()
        const newCommentData: Comment = {
          ...data.comment,
          user_name: 'Current User',
          email: 'user@example.com',
          replies: []
        }

        if (pendingPosition) {
          setCommentPins(prev => [...prev, {
            id: newCommentData.id,
            x: pendingPosition.x,
            y: pendingPosition.y,
            comment: newCommentData
          }])
        }

        setComments(prev => [...prev, newCommentData])
        setNewComment('')
        setIsAddingComment(false)
        setPendingPosition(null)
      }
    } catch (error) {
      console.error('Failed to add comment:', error)
    }
  }

  const addReply = async (parentId: string) => {
    if (!replyContent.trim()) return

    try {
      const userId = 'demo-user' // Replace with actual user ID
      const response = await fetch(`/api/designs/${designId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          content: replyContent,
          parent_id: parentId
        })
      })

      if (response.ok) {
        const data = await response.json()
        const newReply: Comment = {
          ...data.comment,
          user_name: 'Current User',
          email: 'user@example.com',
          replies: []
        }

        setComments(prev => updateCommentWithReply(prev, parentId, newReply))
        setReplyContent('')
        setReplyingTo(null)
      }
    } catch (error) {
      console.error('Failed to add reply:', error)
    }
  }

  const updateCommentWithReply = (comments: Comment[], parentId: string, reply: Comment): Comment[] => {
    return comments.map(comment => {
      if (comment.id === parentId) {
        return {
          ...comment,
          replies: [...(comment.replies || []), reply]
        }
      }
      if (comment.replies) {
        return {
          ...comment,
          replies: updateCommentWithReply(comment.replies, parentId, reply)
        }
      }
      return comment
    })
  }

  const resolveComment = async (commentId: string) => {
    try {
      // In a real app, you'd have a PATCH/PUT endpoint to resolve comments
      setComments(prev => updateCommentStatus(prev, commentId, true))
      setCommentPins(prev => prev.filter(pin => pin.id !== commentId))
    } catch (error) {
      console.error('Failed to resolve comment:', error)
    }
  }

  const updateCommentStatus = (comments: Comment[], commentId: string, resolved: boolean): Comment[] => {
    return comments.map(comment => {
      if (comment.id === commentId) {
        return { ...comment, resolved }
      }
      if (comment.replies) {
        return {
          ...comment,
          replies: updateCommentStatus(comment.replies, commentId, resolved)
        }
      }
      return comment
    })
  }

  const deleteComment = async (commentId: string) => {
    try {
      // In a real app, you'd have a DELETE endpoint
      setComments(prev => removeComment(prev, commentId))
      setCommentPins(prev => prev.filter(pin => pin.id !== commentId))
    } catch (error) {
      console.error('Failed to delete comment:', error)
    }
  }

  const removeComment = (comments: Comment[], commentId: string): Comment[] => {
    return comments
      .filter(comment => comment.id !== commentId)
      .map(comment => ({
        ...comment,
        replies: removeComment(comment.replies || [], commentId)
      }))
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60))
      return `${diffMinutes}m ago`
    } else if (diffHours < 24) {
      return `${diffHours}h ago`
    } else {
      return date.toLocaleDateString()
    }
  }

  if (!isOpen) return null

  return (
    <>
      {/* Comment Pins on Canvas */}
      {canvasRef && commentPins.map((pin) => (
        <div
          key={pin.id}
          className="absolute w-6 h-6 bg-blue-500 rounded-full border-2 border-white cursor-pointer hover:bg-blue-600 transition-colors flex items-center justify-center"
          style={{
            left: pin.x - 12,
            top: pin.y - 12,
            zIndex: 10
          }}
          onClick={() => setSelectedComment(pin.id)}
        >
          <MessageSquare className="w-3 h-3 text-white" />
        </div>
      ))}

      {/* Comments Panel */}
      <div className="fixed inset-y-0 right-0 w-96 bg-white border-l shadow-lg z-40 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            <h2 className="text-lg font-semibold">Comments</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddingComment(!isAddingComment)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                isAddingComment
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <Pin className="w-4 h-4" />
              {isAddingComment ? 'Click canvas to place' : 'Add Comment'}
            </button>
            
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showResolved}
                onChange={(e) => setShowResolved(e.target.checked)}
                className="rounded"
              />
              Show resolved
            </label>
          </div>

          {isAddingComment && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-700">
                Click anywhere on the canvas to place a comment pin, or type below for a general comment.
              </p>
            </div>
          )}
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No comments yet</p>
              <p className="text-xs mt-1">Start a discussion about this design</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <CommentThread
                  key={comment.id}
                  comment={comment}
                  onReply={setReplyingTo}
                  onResolve={resolveComment}
                  onDelete={deleteComment}
                  isReplying={replyingTo === comment.id}
                  replyContent={replyContent}
                  setReplyContent={setReplyContent}
                  addReply={addReply}
                />
              ))}
            </div>
          )}
          <div ref={commentEndRef} />
        </div>

        {/* New Comment Input */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder={pendingPosition ? "Add comment at this location..." : "Add a general comment..."}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && addComment()}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
            />
            <button
              onClick={addComment}
              disabled={!newComment.trim()}
              className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

interface CommentThreadProps {
  comment: Comment
  onReply: (id: string) => void
  onResolve: (id: string) => void
  onDelete: (id: string) => void
  isReplying: boolean
  replyContent: string
  setReplyContent: (content: string) => void
  addReply: (parentId: string) => void
}

function CommentThread({
  comment,
  onReply,
  onResolve,
  onDelete,
  isReplying,
  replyContent,
  setReplyContent,
  addReply
}: CommentThreadProps) {
  const [showReplies, setShowReplies] = useState(true)

  return (
    <div className={`border rounded-lg p-3 ${comment.resolved ? 'bg-gray-50 opacity-75' : 'bg-white'}`}>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
          <User className="w-4 h-4 text-gray-600" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{comment.user_name}</span>
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(comment.created_at)}
              </span>
              {comment.resolved && (
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                  Resolved
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              {!comment.resolved && (
                <button
                  onClick={() => onResolve(comment.id)}
                  className="p-1 text-green-600 hover:bg-green-50 rounded"
                  title="Resolve"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => onDelete(comment.id)}
                className="p-1 text-red-500 hover:bg-red-50 rounded"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <p className="text-sm text-gray-700 mb-2">{comment.content}</p>
          
          {comment.x_coordinate && comment.y_coordinate && (
            <div className="text-xs text-gray-500 mb-2">
              📍 Position: ({Math.round(comment.x_coordinate)}, {Math.round(comment.y_coordinate)})
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => onReply(comment.id)}
              className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <Reply className="w-3 h-3" />
              Reply
            </button>
            
            {comment.replies && comment.replies.length > 0 && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                {showReplies ? 'Hide' : 'Show'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
              </button>
            )}
          </div>
          
          {isReplying && (
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                placeholder="Write a reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && addReply(comment.id)}
                className="flex-1 px-2 py-1 border border-gray-200 rounded text-sm"
                autoFocus
              />
              <button
                onClick={() => addReply(comment.id)}
                disabled={!replyContent.trim()}
                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
              >
                Reply
              </button>
              <button
                onClick={() => onReply('')}
                className="px-3 py-1 border border-gray-200 rounded text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
      
      {showReplies && comment.replies && comment.replies.length > 0 && (
        <div className="ml-11 mt-3 space-y-3">
          {comment.replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onResolve={onResolve}
              onDelete={onDelete}
              isReplying={false}
              replyContent=""
              setReplyContent={() => {}}
              addReply={addReply}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

  if (diffHours < 1) {
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    return `${diffMinutes}m ago`
  } else if (diffHours < 24) {
    return `${diffHours}h ago`
  } else {
    return date.toLocaleDateString()
  }
}
