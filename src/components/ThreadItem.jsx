// Not Used
import React from 'react';
import { formatDistanceToNow, parseISO } from 'date-fns';

export default React.memo(function ThreadItem({ thread, isActive, style, onClick }) {
  // calculate displayName/subtitle here exactly as you did inline…
                                 let displayName, subtitle;
                                if (thread.type === 'direct') {
                                  displayName = thread.user.username;
                                  subtitle = thread.last_message || 'No messages yet';
                                } else if (thread.type === 'marketplace') {
                                  displayName = thread.item_title;
                                  subtitle = `${thread.other_user.username}: ${thread.last_message || 'No messages yet'}`;
                                } else {
                                  displayName = thread.group.name;
                                  subtitle = thread.last_message || 'No messages yet';
                                }

                                const lastAt = thread.last_message_time
                                  ? formatDistanceToNow(parseISO(thread.last_message_time), { addSuffix: true })
                                  : '';
                                const unread = thread.unread_count > 0;
  return (
                                  <div
                                    style={style}
                                    onClick={onClick}
                                    className={`
                                      flex items-center justify-between px-4 py-3 rounded-lg cursor-pointer
                                      ${isActive ? 'bg-gray-700 border-l-4 border-blue-500' : 'hover:bg-gray-700'}
                                      transition-colors
                                    `}
                                  >
                                    <div className="flex items-center space-x-3 min-w-0">
                                      <div
                                        className={`
                                          h-10 w-10 flex-shrink-0 rounded-full overflow-hidden bg-gray-600 ring-2
                                          ${isActive ? 'ring-blue-500' : 'ring-transparent'} transition
                                        `}
                                      >
                                        {thread.type === 'direct' && thread.user.profile_image ? (
                                          <img
                                            src={thread.user.profile_image}
                                            alt={thread.user.username}
                                            className="h-full w-full object-cover"
                                          />
                                        ) : thread.type === 'marketplace' ? (
                                          thread.item_thumbnail ? (
                                            <img
                                              src={thread.item_thumbnail}
                                              alt={thread.item_title}
                                              className="h-full w-full object-cover"
                                            />
                                          ) : (
                                            <span className="flex h-full w-full items-center justify-center text-white text-lg">
                                              🛒
                                            </span>
                                          )
                                        ) : (
                                          <span className="flex h-full w-full items-center justify-center text-white font-bold">
                                            {displayName[0].toUpperCase()}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex flex-col min-w-0">
                                        <p className="text-sm font-semibold text-gray-100 truncate">
                                          {displayName}
                                        </p>
                                        <p className="text-xs text-gray-400 truncate">
                                          {subtitle}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex flex-col items-end space-y-1">
                                      {unread && (
                                        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-blue-500 text-white text-xs">
                                          {thread.unread_count}
                                        </span>
                                      )}
                                      <span className="text-xs text-gray-400">{lastAt}</span>
                                    </div>
                                  </div>
  );
});