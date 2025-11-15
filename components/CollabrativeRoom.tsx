"use client";

import { ClientSideSuspense, RoomProvider } from "@liveblocks/react";
import React, { useEffect, useRef, useState } from "react";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { Editor } from "@/components/editor/Editor";
import Header from "@/components/Header";
import Loader from "./Loader";
import ActiveCollabrator from "./ActiveCollabrator";
import { Input } from "./ui/input";
import Image from "next/image";
import { updateDocument } from "@/lib/actions/room.actions";
import ShareModal from "./ShareModal";
import DrawingCanvas from "./DrawingCanvas";
import DrawingToolbar from "./DrawingToolbar";
import { useUser } from "@clerk/nextjs";
import { LiveList } from "@liveblocks/client";

type RoomMetadata = {
  creatorId: string;
  email: string;
  title: string;
};
type UserType = "creator" | "editor" | "viewer";


type User = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  color: string;
  userType?: UserType;
};

const CollabrativeRoom = ({
  roomId,
  roomMetaData,
  users,
  currentUserType
}: {
  roomId: string;
  roomMetaData: RoomMetadata;
  users:User[];
  currentUserType: UserType;
}) => {

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [documentTitle, setDocumentTitle] = useState(roomMetaData.title);

  // Drawing feature states
  const [drawingMode, setDrawingMode] = useState(false);
  const [currentColor, setCurrentColor] = useState("#000000");
  const [currentWidth, setCurrentWidth] = useState(4);
  const [tool, setTool] = useState<"pen" | "eraser">("pen");

  const { user } = useUser();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const updateTitleHeader = async(e: React.KeyboardEvent<HTMLInputElement>) => {
    if(e.key === 'Enter'){
      setLoading(true);
      try {
        if(documentTitle !== roomMetaData.title){
          const updatedDocument = await updateDocument(roomId,documentTitle);
          if(updatedDocument){
            setEditing(false)
          }
        }
      } catch (error) {
        console.log("Error While Updating Title",error)
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if(editing && inputRef.current){
      inputRef.current.focus();
    }
  },[editing])

  useEffect(() => {
    const handleClickOutSide = (e : MouseEvent) => {
      if(containerRef.current && !containerRef.current.contains(e.target as Node)){
        setEditing(false);
        updateDocument(roomId,documentTitle);
      }
    }
    document.addEventListener('mousedown',handleClickOutSide);

    return() => {
      document.removeEventListener('mousedown',handleClickOutSide)
    }
  },[roomId,documentTitle]);

  return (
    <div>
      <RoomProvider 
        id={roomId}
        initialStorage={{
          drawings: new LiveList([]),
        }}
      >
        <ClientSideSuspense fallback={<Loader />}>
        <div className="flex size-full max-h-screen flex-1 flex-col items-center overflow-hidden relative">
          <Header>
            <div
              ref={containerRef}
              className="flex w-full justify-center items-center gap-2"
            >
              {editing && !loading ? (
                <Input
                  type="text"
                  value={documentTitle}
                  onChange={(e) => setDocumentTitle(e.target.value)}
                  ref={inputRef}
                  placeholder="Enter Title..."
                  onKeyDown={updateTitleHeader}
                  disabled={!editing}
                  className="w-full max-w-[300px] truncate border-none bg-transparent text-center sm:text-xl text-base font-semibold leading-tight focus-visible:ring-0 focus-visible:ring-offset-0 disabled:text-white transition-all duration-200 h-7 sm:h-8"
                />
              ) : (
                <>
                  <p className="text-white truncate max-w-[300px] sm:text-xl text-base font-semibold leading-tight h-7 sm:h-8">{documentTitle}</p>
                </>
              )}

              {currentUserType === "editor" && !editing && (
                <Image
                  src="/assets/icons/edit.svg"
                  alt="Editing Icon"
                  height={25}
                  width={25}
                  onClick={() => setEditing(true)}
                  className="cursor-pointer"
                />
              )}

              {currentUserType !== "editor" && !editing && (
                <p className="rounded-md bg-dark-400/50 px-2 py-0.5 text-xs text-blue-100/50">View Only</p>
              )}
              {loading && <p className="text-sm text-gray-400">Saving..</p>}
            </div>
            <div className="flex w-[250px] justify-end gap-2 sm:gap-2">

            {/* Download Button */}
            <button
              onClick={() => {
                // This will be handled by a separate component inside the editor
                const event = new CustomEvent('downloadDocument', { 
                  detail: { title: documentTitle } 
                });
                window.dispatchEvent(event);
              }}
              className="flex items-center gap-2 px-3 py-2 rounded-md transition-all bg-green-500 hover:bg-green-600 text-white"
              title="Download as Word file"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="hidden sm:inline text-sm">Download</span>
            </button>

            {/* Drawing Mode Toggle Button */}
            <button
              onClick={() => setDrawingMode(!drawingMode)}
              className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all ${
                drawingMode
                  ? "bg-blue-500 text-white"
                  : "bg-dark-400 text-gray-300 hover:bg-dark-400/70"
              }`}
              title={drawingMode ? "Exit Drawing Mode" : "Enter Drawing Mode"}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              <span className="hidden sm:inline text-sm">
                {drawingMode ? "Drawing" : "Draw"}
              </span>
            </button>

            <ActiveCollabrator />

              <ShareModal 
                roomId={roomId}
                collaborators={users}
                creatorId={roomMetaData.creatorId}
                currentUserType={currentUserType}
              />

              <div className="flex gap-2">
                <SignedOut>
                  <div className="bg-white cursor-pointer p-2 px-5 text-black rounded-full">
                    <SignInButton mode="modal" />
                  </div>
                  <div className="bg-white cursor-pointer p-2 px-5 text-black rounded-full">
                    <SignUpButton mode="modal" />
                  </div>
                </SignedOut>
                <SignedIn>
                  <UserButton />
                </SignedIn>
              </div>
            </div>
          </Header>
          
          {/* Drawing Components */}
          {drawingMode && (
            <DrawingToolbar
              currentColor={currentColor}
              setCurrentColor={setCurrentColor}
              currentWidth={currentWidth}
              setCurrentWidth={setCurrentWidth}
              tool={tool}
              setTool={setTool}
              onClose={() => setDrawingMode(false)}
              userType={currentUserType}
            />
          )}

          {/* Drawing Canvas Overlay */}
          <div className="relative flex-1 w-full">
            <Editor currentUserType={currentUserType} />
            {user && (
              <DrawingCanvas
                currentColor={currentColor}
                currentWidth={currentWidth}
                tool={tool}
                isEnabled={drawingMode}
                currentUserId={user.id}
                currentUserName={user.fullName || user.firstName || "Anonymous"}
                userType={currentUserType}
              />
            )}
          </div>
        </div>
        </ClientSideSuspense>
      </RoomProvider>
    </div>
  );
};

export default CollabrativeRoom;
