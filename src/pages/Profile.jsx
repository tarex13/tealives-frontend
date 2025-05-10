import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import MarketplaceCard from './MarketplaceCard'
import FeedCard from '../components/FeedCard'

function Profile() {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [listings, setListings] = useState([])
  console.log(user)
  useEffect(() => {
    if (!user || !user.user?.id) return;
  
    const load = async () => {
      try {
        const [postRes, listingRes] = await Promise.all([
          api.get(`posts/?user=${user.user.id}`),
          api.get(`marketplace/`)
        ])
  
        const postData = Array.isArray(postRes.data?.results) ? postRes.data.results : postRes.data
        const listingData = Array.isArray(listingRes.data?.results) ? listingRes.data.results : listingRes.data
  
        setPosts(postData)
        setListings(listingData.filter(i => i.seller === user.user.id))
      } catch (err) {
        console.error("Failed to load profile data:", err)
      }
    }
  
    load()
  }, [user])
  

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">My Profile</h1>

      <div className="mb-6 bg-white p-4 rounded shadow">
        <p><strong>Username:</strong> {user.user.username}</p>
        <p><strong>City:</strong> {user.user.city}</p>
        <p><strong>Email:</strong> {user.user.email}</p>
      </div>

      <h2 className="text-xl font-semibold mb-2">My Posts</h2>
      {Array.isArray(posts) && posts.length === 0 ? (
        <p className="text-gray-500">You haven't posted yet.</p>
      ) : (
        posts.map((p) => <FeedCard key={p.id} post={p} />)
      )}

      <h2 className="text-xl font-semibold mt-6 mb-2">My Listings</h2>
      {Array.isArray(listings) && listings.length === 0 ? (
        <p className="text-gray-500">No marketplace listings yet.</p>
      ) : (
        listings.map((item) => <MarketplaceCard key={item.id} item={item} />)
      )}
    </div>
  )
}

export default Profile
