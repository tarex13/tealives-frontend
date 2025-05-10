import React, { useEffect, useState } from 'react'
import api from '../api'
import { useAuth } from '../context/AuthContext'

// Recursive Comment component
function Comment({ comment, depth = 0, replyTo, onReply, onSubmitReply }) {
  const [replyText, setReplyText] = useState('')

  return (
    <div className="ml-4 mt-2">
      <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded">
        <p className="text-sm font-semibold">{comment.anonymous ? 'Anonymous' : comment.user}</p>
        <p className="mb-1">{comment.content}</p>

        {/* ✅ Only show Reply button if depth <= 5 */}
        {depth <= 5 && (
          <button
            onClick={() => onReply(comment.id)}
            className="text-xs text-blue-600"
          >
            Reply
          </button>
        )}

        {/* Reply input box */}
        {replyTo === comment.id && (
          <div className="mt-2">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="w-full border p-2 rounded mt-1"
              rows={2}
              placeholder="Write your reply..."
            />
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => {
                  onSubmitReply(comment.id, replyText)
                  setReplyText('')
                }}
                className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
              >
                Send
              </button>
              <button
                onClick={() => onReply(null)}
                className="text-xs text-red-500"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Recursively render replies */}
      {Array.isArray(comment.replies) && comment.replies.length > 0 && (
        <div className="ml-4 mt-2">
          {comment.replies.map((child) => (
            <Comment
              key={child.id}
              comment={child}
              depth={depth + 1}
              replyTo={replyTo}
              onReply={onReply}
              onSubmitReply={onSubmitReply}
            />
          ))}
        </div>
      )}
    </div>
  )
}


export default function CommentSection({ postId }) {
  const [comments, setComments] = useState([])
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  const { user } = useAuth()

  const loadComments = async () => {
    try {
      const res = await api.get(`posts/${postId}/comments/`)
      const data = res.data?.results || res.data || []
      setComments(data)
    } catch (err) {
      console.error('Failed to load comments:', err)
    }
  }

  useEffect(() => {
    loadComments()
  }, [postId])

  const handleSubmitMain = async () => {
    if (!newComment.trim()) return
    try {
      await api.post(`posts/${postId}/comments/`, {
        content: newComment,
        anonymous: false,
      })
      setNewComment('')
      await loadComments()
    } catch (err) {
      console.error('Main comment error:', err)
    }
  }

  const handleReplySubmit = async (parentId, content) => {
    if (!content.trim()) return
    try {
      await api.post(`posts/${postId}/comments/`, {
        content,
        parent: parentId,
        anonymous: false,
      })
      setReplyTo(null)
      await loadComments()
    } catch (err) {
      console.error('Reply error:', err)
    }
  }

  return (
    <div className="mt-6">
      <h4 className="font-bold mb-2">Comments</h4>
      <textarea
        value={newComment}
        onChange={(e) => setNewComment(e.target.value)}
        className="w-full border p-2 rounded"
        rows={3}
        placeholder="Write a comment"
      />
      <button
        onClick={handleSubmitMain}
        className="mt-2 bg-blue-600 text-white px-4 py-1 rounded"
      >
        Submit
      </button>

      <div className="mt-6">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-500">No comments yet.</p>
        ) : (
          comments.map((c) => (
            <Comment
              key={c.id}
              comment={c}
              replyTo={replyTo}
              onReply={setReplyTo}
              onSubmitReply={handleReplySubmit}
            />
          ))
        )}
      </div>
    </div>
  )
}
