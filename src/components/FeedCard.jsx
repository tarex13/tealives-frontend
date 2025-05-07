function FeedCard({ post }) {
    return (
      <div className="bg-white p-4 rounded shadow mb-4">
        <div className="text-sm text-gray-500">
          {post.post_type.toUpperCase()} • {new Date(post.created_at).toLocaleString()}
        </div>
        <h3 className="text-lg font-bold mb-1">{post.title}</h3>
        <p>{post.content}</p>
        <div className="mt-2 text-sm text-gray-400">
          {post.anonymous ? 'Posted anonymously' : `By ${post.user}`}
        </div>
      </div>
    )
  }
  
  export default FeedCard
  