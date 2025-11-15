"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { useSelf } from "@liveblocks/react/suspense";
import Image from "next/image";
import React, { useState } from "react";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import UserTypeSelector from "./UserTypeSelector";
import { updateDocumentAccess } from "@/lib/actions/room.actions";
import Collaborator from "./Collabrator";
type UserType = "creator" | "editor" | "viewer";

type User = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  color: string;
  userType?: UserType;
};

const ShareModal = ({
  roomId,
  collaborators,
  creatorId,
  currentUserType,
}: {
  roomId: string;
  collaborators: User[];
  creatorId: string;
  currentUserType: UserType;
}) => {
  const user = useSelf();

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [userType, setUserType] = useState<UserType>("viewer");

  const shareDocumentHandler = async () => {
    setLoading(true);

    await updateDocumentAccess({
      roomId,
      email,
      userType: userType as UserType,
      updatedBy: user.info,
    });

    setLoading(false);
  };


  console.log(currentUserType);
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          className="bg-gradient-to-t from-blue-500 to-blue-400 flex h-9 gap-1 px-3 cursor-pointer"
          disabled={currentUserType !== "editor"}
        >
          <Image
            src="/assets/icons/share.svg"
            alt="Share Icon"
            width={20}
            height={20}
            className="min-w-a md:size-5"
          />
          <p className="mr-1 hidden sm:block">Share</p>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-full max-w-[400px] rounded-xl border-none bg-[url(/assets/images/doc.png)] bg-cover px-5 py-7 shadow-xl sm:min-w-[500px] !important">
        <DialogHeader>
          <DialogTitle>Manage Sharing</DialogTitle>
          <DialogDescription>
            {" "}
            Share your document with others to collaborate and edit together.{" "}
          </DialogDescription>
        </DialogHeader>
        <Label htmlFor="email" className="mt-6 text-blue-100">
          Email
        </Label>
        <div className="flex items-center gap-3">
          <div className="flex flex-1 rounded-md bg-dark-400">
            <Input
              id="email"
              placeholder="Enter email"
              className="h-11 flex-1 border-none bg-dark-400 focus-visible:ring-0 focus-visible:ring-offset-0 !important"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <UserTypeSelector userType={userType} setUserType={setUserType} />
            <Button
              type="submit"
              onClick={shareDocumentHandler}
              className="bg-gradient-to-t from-blue-500 to-blue-400 flex h-full gap-1 px-5"
              disabled={loading}
            >
              {loading ? "Sending..." : "Invite"}
            </Button>
          </div>
        </div>
        <div className="my-2 space-y-2">
          <ul className="flex flex-col">
            {collaborators.map((collaborator) => (
              <Collaborator 
                key={collaborator.id}
                roomId={roomId}
                creatorId={creatorId}
                email={collaborator.email}
                collaborator={collaborator}
                user={user.info}
              />
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;
