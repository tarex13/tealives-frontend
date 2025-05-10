import { useState } from 'react'
import { createPost } from '../requests'
import React from 'react'

function CreatePost({ onPostCreated }) {
  const [form, setForm] = useState({
    title: '',
    content: '',
    post_type: 'discussion',
    anonymous: false,
    poll_options: [''],
  })

  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
  }

  const handlePollOptionChange = (index, value) => {
    const newOptions = [...form.poll_options];
    newOptions[index] = value;
    setForm({ ...form, poll_options: newOptions });
  };

  
  const addPollOption = () => {
    setForm({ ...form, poll_options: [...form.poll_options, ''] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const newPost = await createPost(form)
      onPostCreated?.(newPost)
      setForm({ title: '', content: '', post_type: 'discussion', anonymous: false,  poll_options: [''], })
      setError(null)
    } catch (err) {
      setError('Failed to create post.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow mb-6">
      <h2 className="text-xl font-bold mb-3">Start a conversation</h2>
      {error && <p className="text-red-500 mb-2">{error}</p>}
      <input
        type="text"
        name="title"
        placeholder="Post title"
        value={form.title}
        onChange={handleChange}
        required
        className="w-full border p-2 rounded mb-2"
      />
      <textarea
        name="content"
        placeholder="What's on your mind?"
        value={form.content}
        onChange={handleChange}
        required
        rows={4}
        className="w-full border p-2 rounded mb-2"
      />
      <div className="flex gap-4 items-center mb-2">
        <select
          name="post_type"
          value={form.post_type}
          onChange={handleChange}
          className="border p-2 rounded"
        >
          <option value="discussion">Discussion</option>
          <option value="alert">Alert</option>
          <option value="question">Question</option>
          <option value="rant">Rant</option>
          <option value="poll">Poll</option>
        </select>
        <label className="text-sm flex items-center gap-1">
          <input
            type="checkbox"
            name="anonymous"
            checked={form.anonymous}
            onChange={handleChange}
          />
          Post anonymously
        </label>
      </div>
      {form.post_type === 'poll' && (
        <div className="mb-2">
          <h4 className="font-medium mb-1">Poll Options:</h4>
          {form.poll_options.map((opt, idx) => (
            <input
              key={idx}
              type="text"
              value={opt}
              onChange={(e) => handlePollOptionChange(idx, e.target.value)}
              placeholder={`Option ${idx + 1}`}
              className="w-full border p-2 rounded mb-1"
              required
            />
          ))}
          <button
            type="button"
            onClick={addPollOption}
            className="text-xs text-blue-600 mt-1"
          >
            + Add Option
          </button>
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        {loading ? 'Posting...' : 'Post'}
      </button>
    </form>
  )
}

export default CreatePost
