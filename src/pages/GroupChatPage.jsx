import React from 'react'
import { useParams } from 'react-router-dom'
import GroupChatThread from '../components/GroupChatThread'

function GroupChatPage() {
  const { groupId } = useParams()
  const currentUserId = JSON.parse(localStorage.getItem('user'))?.user?.id

  return (
    <GroupChatThread
      groupId={groupId}
      groupName={`Group ${groupId}`} // Optional: Fetch real name via API
      currentUserId={currentUserId}
    />
  )
}

export default GroupChatPage
