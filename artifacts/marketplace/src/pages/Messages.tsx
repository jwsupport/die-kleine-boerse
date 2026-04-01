import { useState, useRef, useEffect } from "react";
import { useGetConversations, getGetConversationsQueryKey, useGetMessages, getGetMessagesQueryKey, useSendMessage } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { Send } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryClient } from "@tanstack/react-query";

export function Messages() {
  const currentUserId = "user-demo-1";
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);
  
  const { data: conversations, isLoading: loadingConvos } = useGetConversations({ userId: currentUserId }, {
    query: {
      queryKey: getGetConversationsQueryKey({ userId: currentUserId })
    }
  });

  const [activeListingId, setActiveListingId] = useState<string | null>(null);
  
  const activeConversation = conversations?.find(c => c.listingId === activeListingId);
  const otherUserId = activeConversation?.otherUserId;

  const { data: messages, isLoading: loadingMessages } = useGetMessages(activeListingId!, { userId: currentUserId }, {
    query: {
      enabled: !!activeListingId,
      queryKey: getGetMessagesQueryKey(activeListingId!, { userId: currentUserId })
    }
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useSendMessage();
  const [newMessage, setNewMessage] = useState("");

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeListingId || !otherUserId) return;
    
    const sentMessageContent = newMessage;
    setNewMessage("");

    sendMessage.mutate({
      data: {
        senderId: currentUserId,
        receiverId: otherUserId,
        content: sentMessageContent
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: getGetMessagesQueryKey(activeListingId, { userId: currentUserId })
        });
        queryClient.invalidateQueries({
          queryKey: getGetConversationsQueryKey({ userId: currentUserId })
        });
      },
      onError: () => {
        setNewMessage(sentMessageContent); // restore on error
      }
    });
  };

  return (
    <div className="h-[100dvh] flex flex-col bg-background overflow-hidden">
      <Navbar />
      
      <main className="flex-1 flex overflow-hidden container mx-auto max-w-5xl px-4 py-6">
        <div className="flex w-full bg-white rounded-sm border border-slate-200 overflow-hidden shadow-sm">
          
          {/* Sidebar */}
          <div className="w-1/3 border-r border-slate-200 flex flex-col bg-white">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50">
              <h2 className="font-medium text-slate-900">Conversations</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {loadingConvos ? (
                <div className="p-4 space-y-4">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
                </div>
              ) : conversations && conversations.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {conversations.map(convo => (
                    <button
                      key={convo.listingId}
                      onClick={() => setActiveListingId(convo.listingId)}
                      className={`w-full text-left p-4 hover:bg-slate-50 transition-colors flex gap-4 ${activeListingId === convo.listingId ? 'bg-slate-50' : ''}`}
                    >
                      <div className="w-12 h-12 rounded-sm overflow-hidden bg-slate-100 flex-shrink-0">
                        {convo.listingImage ? (
                          <img src={convo.listingImage} alt={convo.listingTitle} className="w-full h-full object-cover" />
                        ) : null}
                      </div>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex justify-between items-baseline mb-1">
                          <h3 className="font-medium text-sm text-slate-900 truncate pr-2">{convo.listingTitle}</h3>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">
                            {formatDistanceToNow(new Date(convo.lastMessageAt))}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate">{convo.lastMessage}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-sm text-slate-500">
                  No conversations yet.
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col bg-slate-50/30">
            {activeListingId ? (
              <>
                <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h2 className="font-medium text-slate-900">{activeConversation?.listingTitle}</h2>
                    <span className="text-xs text-slate-500 px-2 py-0.5 bg-slate-100 rounded-full">
                      Chatting with {activeConversation?.otherUserName || 'User'}
                    </span>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                  {loadingMessages ? (
                    <div className="space-y-4">
                      <Skeleton className="h-12 w-2/3 ml-auto" />
                      <Skeleton className="h-12 w-1/2" />
                    </div>
                  ) : messages?.map(msg => {
                    const isMe = msg.senderId === currentUserId;
                    return (
                      <div key={msg.id} className={`flex max-w-[75%] ${isMe ? 'ml-auto' : ''}`}>
                        <div className={`p-3 rounded-md text-sm ${isMe ? 'bg-slate-900 text-white rounded-br-sm' : 'bg-white border border-slate-200 text-slate-900 rounded-bl-sm shadow-sm'}`}>
                          {msg.content}
                          <div className={`text-[10px] mt-1 ${isMe ? 'text-slate-300' : 'text-slate-400'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={bottomRef} />
                </div>
                
                <div className="p-4 bg-white border-t border-slate-200">
                  <form onSubmit={handleSend} className="flex gap-2">
                    <Input 
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 focus-visible:ring-slate-300"
                    />
                    <Button type="submit" disabled={sendMessage.isPending || !newMessage.trim()} size="icon" className="rounded-sm shrink-0">
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-4">
                <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                  <Send className="w-6 h-6 text-slate-300" />
                </div>
                <p>Select a conversation to start messaging</p>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
