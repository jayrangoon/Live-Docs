"use server";

import CollabrativeRoom from "@/components/CollabrativeRoom";
import { getDocument } from "@/lib/actions/room.actions";
import { getClerkusers } from "@/lib/actions/user.action";
import { currentUser } from "@clerk/nextjs/server";
import "@clerk/themes";
import { redirect } from "next/navigation";

import React from "react";

// Correct Type for Next.js Route Params
type DocumentProps = {
  params: Promise<{ id: string }>;
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

const Document = async ({ params }: DocumentProps) => {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }
  // ✅ Await params
  //  const roomId = params?.id;
  //  console.log(params?.id);
  const { id } = await params;

  if (!id) {
    console.error("🚨 Room ID is missing in URL.");
    redirect("/");
  }

  // console.log("Room ID from params:", id);

  const room = await getDocument({
    roomId: id,
    userId: user.emailAddresses[0].emailAddress,
  });

  if (!room) {
    console.error("Room not found or access denied.");
    redirect("/");
  }

  const userIds = Object.keys(room.usersAccesses);
  const users = await getClerkusers({ userIds });
  // console.log("users", users);
  const usersData = users.map((user: User) => ({
    ...user,
    userType: room.usersAccesses[user?.email]?.includes("room:write")
      ? "editor"
      : "viewer",
  }));

  const currentUserType = room.usersAccesses[
    user.emailAddresses[0].emailAddress
  ]?.includes("room:write")
    ? "editor"
    : "viewer";

  return (
    <div>
      <CollabrativeRoom
        roomId={id}
        roomMetaData={room.metadata}
        users={usersData}
        currentUserType={currentUserType}
      />
    </div>
  );
};

export default Document;
