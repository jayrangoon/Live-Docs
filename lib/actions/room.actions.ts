'use server';

import { nanoid } from "nanoid";
import { liveblocks } from "../liveblocks";
import { RoomAccesses } from "@liveblocks/node";
import { revalidatePath } from "next/cache";
import { getAccessType, parseStringify } from "../utils";

type CreateDocumentParams = {
    userId: string;
    email: string;
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
type ShareDocumentParams = {
    roomId: string;
    email: string;
    userType: UserType;
    updatedBy: User;
};

type AccessType = ["room:write"] | ["room:read", "room:presence:write"];

export const createDocument = async ({ userId, email }: CreateDocumentParams) => {
    const roomId = nanoid();

    try {
        const metadata = {
            creatorId: userId,
            email,
            title: "untitled"
        }

        const usersAccesses: RoomAccesses = {
            [email]: ['room:write']
        }

        const room = await liveblocks.createRoom(roomId, {
            metadata: metadata,
            usersAccesses: usersAccesses,
            defaultAccesses: [],
        });
        
        if (!room) {
            throw new Error("Error Generated While Creating room");
        }
        console.log("Room created :", room);
        revalidatePath('/');

        return parseStringify(room);

    } catch (error) {
        console.log("Error Generate while Creating Room", error);
    }
}

export const getDocument = async ({ roomId, userId }: { roomId: string, userId: string }) => {
    try {
        console.log("roomId,userid:", roomId, userId)
        const room = await liveblocks.getRoom(roomId);

        if (!room) {
            throw new Error("No Room in getDocumeent");
        }
        console.log("Fetching room", room);

        const hasAccess = Object.keys(room.usersAccesses).includes(userId);

        if (!hasAccess) {
            throw new Error("You Have No Access to the room");
        }
        return parseStringify(room);
    } catch (error) {
        console.log("Error Happened while getting Room", error);
    }
}

export const getDocuments = async (email: string) => {
    try {

        const userRooms = await liveblocks.getRooms({userId : email});

        return parseStringify(userRooms);
    } catch (error) {
        console.log("Error Happened while getting Rooms", error);
    }
}

export const updateDocument = async (roomId: string, title: string) => {
    try {
        const updatedDocument = await liveblocks.updateRoom(roomId, {
            metadata: {
                title
            }
        })
        revalidatePath(`/documents/${roomId}`);
        return parseStringify(updatedDocument);
    } catch (err) {
        console.log("Error While Updating Doc", err);
    }
}
export const updateDocumentAccess = async ({ roomId, email, userType, updatedBy }: ShareDocumentParams) => {
    try {
      const usersAccesses: RoomAccesses = {
        [email]: getAccessType(userType) as AccessType,
      }
  
      const room = await liveblocks.updateRoom(roomId, { 
        usersAccesses
      })
  
      if(room) {
        const notificationId = nanoid();
  
        await liveblocks.triggerInboxNotification({
          userId: email,
          kind: '$documentAccess',
          subjectId: notificationId,
          activityData: {
            userType,
            title: `You have been granted ${userType} access to the document by ${updatedBy.name}`,
            updatedBy: updatedBy.name,
            avatar: updatedBy.avatar,
            email: updatedBy.email
          },
          roomId
        })
      }
  
      revalidatePath(`/documents/${roomId}`);
      return parseStringify(room);
    } catch (error) {
      console.log(`Error happened while updating a room access: ${error}`);
    }
  }

  export const removeCollaborator = async ({ roomId, email }: {roomId: string, email: string}) => {
    try {
      const room = await liveblocks.getRoom(roomId)
  
      if(room.metadata.email === email) {
        throw new Error('You cannot remove yourself from the document');
      }
  
      const updatedRoom = await liveblocks.updateRoom(roomId, {
        usersAccesses: {
          [email]: null
        }
      })
  
      revalidatePath(`/documents/${roomId}`);
      return parseStringify(updatedRoom);
    } catch (error) {
      console.log(`Error happened while removing a collaborator: ${error}`);
    }
  }