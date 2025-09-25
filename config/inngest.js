import { Inngest } from "inngest";
import connectDB from "./db";
import User from "@/models/User";
import { createClerkClient } from '@clerk/backend';

// Create a client to send and receive events
export const inngest = new Inngest({ id: "dtf-drop-next" });

// Inngest function to Save User to DB

export const syncUserCreation = inngest.createFunction(
  {
    id: "sync-user-from-clerk",
  },
  { event: "clerk/user.created" },
  async ({ event }) => {
    try {
      const {id, first_name, last_name, email_addresses, image_url, public_metadata} = event.data;
      
      // Create Clerk client for updating user metadata
      const clerkClient = createClerkClient({ 
        secretKey: process.env.CLERK_SECRET_KEY 
      });
      
      // Check if user already has a role assigned
      if (!public_metadata?.role) {
        // Automatically assign customer role to new users
        await clerkClient.users.updateUser(id, {
          publicMetadata: {
            ...public_metadata,
            role: 'customer'
          }
        });
        console.log(`Assigned customer role to new user: ${id}`);
      } else {
        console.log(`User ${id} already has role: ${public_metadata.role}`);
      }

      // Save user data to MongoDB
      const userData = {
          _id: id,
          name: `${first_name} ${last_name}`,
          email: email_addresses[0].email_address,
          imageUrl: image_url,
      };
      
      await connectDB();
      await User.create(userData);
      
      console.log(`User synced successfully: ${id}`);
      
    } catch (error) {
      console.error('Error in syncUserCreation:', error);
      throw error; // Re-throw to trigger Inngest retry
    }
  }
);


// INNGEST function to Update User

export const syncUserUpdate = inngest.createFunction(
    {
        id: "update-user-from-clerk",
    },
    {event: "clerk/user.updated" },
    async ({ event }) => {
        const {id, first_name, last_name, email_addresses, image_url} = event.data;
        const userData = {
            _id: id,
            name: `${first_name} ${last_name}`,
            email: email_addresses[0].email_address,
            imageUrl: image_url,
        };
        await connectDB()
        await User.findByIdAndUpdate(id, userData)
    }
)

// INNGEST function to Delete User
export const syncUserDeletion = inngest.createFunction(
    {
        id: "delete-user-with-clerk",
    },
    {event: "clerk/user.deleted" },
    async ({ event }) => {
        const {id} = event.data;
        await connectDB()
        await User.findByIdAndDelete(id)
    }
)