import { Inngest } from "inngest";
import connectDB from "./db";
import User from "@/models/User";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "quickcart-next" });

// Inngest function to Save User to DB

export const syncUserCreation = inngest.createFunction(
  {
    id: "sync-user-from-clerk",
  },
  { event: "clerk/user.created" },
  async ({ event }) => {

    const {id, first_name, last_name, email_addresses, image_url} = event.data;
    const userData = {
        _id: id,
        name: `${first_name} ${last_name}`,
        email: email_addresses[0].email_address,
        imageUrl: image_url,
    };
    await connectDB()
    await User.create(userData)
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