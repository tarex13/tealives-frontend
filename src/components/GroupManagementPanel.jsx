import React, { useEffect, useState } from 'react';
import { getGroupMembers, promoteModerator, demoteModerator, removeGroupMember } from '../requests';
import { Button, Card } from '@/components/ui';

export default function GroupManagementPanel({ groupId }) {
    const [members, setMembers] = useState([]);

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        const res = await getGroupMembers(groupId);
        setMembers(res.data);
    };

    const handleRoleChange = async (userId, action) => {
        if (action === 'promote') await promoteModerator(groupId, userId);
        if (action === 'demote') await demoteModerator(groupId, userId);
        if (action === 'remove') await removeGroupMember(groupId, userId);
        fetchMembers();
    };

    return (
        <div className="space-y-4">
            {members.map(member => (
                <Card key={member.id} className="p-4 flex justify-between items-center">
                    <span>{member.username}</span>
                    <div className="space-x-2">
                        <Button onClick={() => handleRoleChange(member.id, 'promote')}>Promote</Button>
                        <Button onClick={() => handleRoleChange(member.id, 'demote')}>Demote</Button>
                        <Button variant="destructive" onClick={() => handleRoleChange(member.id, 'remove')}>Remove</Button>
                    </div>
                </Card>
            ))}
        </div>
    );
}
