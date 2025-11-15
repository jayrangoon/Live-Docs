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
      <RoomProvider id={roomId}>
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
            <div className="flex w-[200px] justify-end gap-2 sm:gap-2">

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
          <Editor currentUserType={currentUserType}/>
        </div>
        </ClientSideSuspense>
      </RoomProvider>
    </div>
  );
};

export default CollabrativeRoom;
