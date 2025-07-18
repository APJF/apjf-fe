"use client"

import { useState, useEffect } from "react"
import { User, Lock, Info, Link, Bell, Wifi } from "lucide-react"

interface UserProfile {
  id: string;
  email: string;
  username: string;
  avatar: string;
  enabled: boolean;
  authorities: string[];
}

const AccountSettingItem = ({ icon, text, active, onClick }: { icon: React.ReactNode, text: string, active: boolean, onClick: () => void }) => (
    <button
        className={`flex items-center px-4 py-3 text-base font-medium cursor-pointer w-full ${
            active ? "text-red-600 border-l-4 border-red-600 bg-red-50" : "text-gray-700 hover:bg-gray-100"
        }`}
        onClick={onClick}
    >
        {icon}
        <span className="ml-4">{text}</span>
    </button>
);

export default function UserProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [activeTab, setActiveTab] = useState("general")

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found");
          return;
        }

        const response = await fetch("http://localhost:8080/api/auth/profile", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        const result = await response.json();
        if (result.success) {
          setProfile(result.data);
        } else {
          console.error("Failed to fetch profile:", result.message);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    };

    fetchProfile();
  }, []);

  if (!profile) {
    return <div>Loading...</div>;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return <GeneralTab profile={profile} />;
      case "password":
        return <PasswordTab />;
      case "info":
        return <InfoTab />;
      case "social":
        return <SocialLinksTab />;
      case "connections":
        return <ConnectionsTab />;
      case "notifications":
        return <NotificationsTab />;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h4 className="text-2xl font-bold py-3 mb-4">Account settings</h4>
      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="flex">
          <div className="w-1/4 border-r">
            <div className="py-4">
              <AccountSettingItem icon={<User size={20} />} text="General" active={activeTab === "general"} onClick={() => setActiveTab("general")} />
              <AccountSettingItem icon={<Lock size={20} />} text="Change password" active={activeTab === "password"} onClick={() => setActiveTab("password")} />
              <AccountSettingItem icon={<Info size={20} />} text="Info" active={activeTab === "info"} onClick={() => setActiveTab("info")} />
              <AccountSettingItem icon={<Link size={20} />} text="Social links" active={activeTab === "social"} onClick={() => setActiveTab("social")} />
              <AccountSettingItem icon={<Wifi size={20} />} text="Connections" active={activeTab === "connections"} onClick={() => setActiveTab("connections")} />
              <AccountSettingItem icon={<Bell size={20} />} text="Notifications" active={activeTab === "notifications"} onClick={() => setActiveTab("notifications")} />
            </div>
          </div>
          <div className="w-3/4">
            <div className="p-6">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </div>
      <div className="text-right mt-6">
        <button type="button" className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Save changes</button>
        <button type="button" className="ml-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Cancel</button>
      </div>
    </div>
  )
}

const GeneralTab = ({ profile }: { profile: UserProfile }) => (
  <div>
    <div className="flex items-center">
      <img src={profile.avatar} alt="avatar" className="w-24 h-24 rounded-full" />
      <div className="ml-6">
        <label htmlFor="avatar-upload" className="px-4 py-2 border border-red-600 text-red-600 rounded-lg cursor-pointer hover:bg-red-50">
          Upload new photo
          <input id="avatar-upload" type="file" className="hidden" />
        </label>
        <button type="button" className="ml-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Reset</button>
        <div className="text-sm text-gray-500 mt-2">Allowed JPG, GIF or PNG. Max size of 800K</div>
      </div>
    </div>
    <hr className="my-6" />
    <div>
      <div className="mb-4">
        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">Username</label>
        <input id="username" type="text" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm" defaultValue={profile.username} />
      </div>
      <div className="mb-4">
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Name</label>
        <input id="name" type="text" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm" defaultValue="Nelle Maxwell" />
      </div>
      <div className="mb-4">
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">E-mail</label>
        <input id="email" type="text" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm" defaultValue={profile.email} />
      </div>
      <div className="mb-4">
        <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">Company</label>
        <input id="company" type="text" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm" defaultValue="Company Ltd." />
      </div>
    </div>
  </div>
);

const PasswordTab = () => (
  <div>
    <div className="mb-4">
      <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 mb-2">Current password</label>
      <input id="current-password" type="password" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm" />
    </div>
    <div className="mb-4">
      <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-2">New password</label>
      <input id="new-password" type="password" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm" />
    </div>
    <div className="mb-4">
      <label htmlFor="repeat-new-password" className="block text-sm font-medium text-gray-700 mb-2">Repeat new password</label>
      <input id="repeat-new-password" type="password" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm" />
    </div>
  </div>
);

const InfoTab = () => (
    <div>
        <div className="mb-4">
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
            <textarea id="bio" rows={5} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris nunc arcu, dignissim sit amet sollicitudin iaculis, vehicula id urna. Sed luctus urna nunc. Donec fermentum, magna sit amet rutrum pretium, turpis dolor molestie diam, ut lacinia diam risus eleifend sapien. Curabitur ac nibh nulla. Maecenas nec augue placerat, viverra tellus non, pulvinar risus.
            </textarea>
        </div>
        <div className="mb-4">
            <label htmlFor="birthday" className="block text-sm font-medium text-gray-700 mb-2">Birthday</label>
            <input id="birthday" type="text" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm" defaultValue="May 3, 1995" />
        </div>
        <div className="mb-4">
            <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-2">Country</label>
            <select id="country" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm">
                <option>USA</option>
                <option>Canada</option>
                <option>UK</option>
                <option>Germany</option>
                <option>France</option>
            </select>
        </div>
        <hr className="my-6" />
        <h6 className="text-lg font-medium mb-4">Contacts</h6>
        <div className="mb-4">
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
            <input id="phone" type="text" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm" defaultValue="+0 (123) 456 7891" />
        </div>
        <div className="mb-4">
            <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">Website</label>
            <input id="website" type="text" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm" />
        </div>
    </div>
);

const SocialLinksTab = () => (
    <div>
        <div className="mb-4">
            <label htmlFor="twitter" className="block text-sm font-medium text-gray-700 mb-2">Twitter</label>
            <input id="twitter" type="text" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm" defaultValue="https://twitter.com/user" />
        </div>
        <div className="mb-4">
            <label htmlFor="facebook" className="block text-sm font-medium text-gray-700 mb-2">Facebook</label>
            <input id="facebook" type="text" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm" defaultValue="https://www.facebook.com/user" />
        </div>
        <div className="mb-4">
            <label htmlFor="google-plus" className="block text-sm font-medium text-gray-700 mb-2">Google+</label>
            <input id="google-plus" type="text" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm" />
        </div>
        <div className="mb-4">
            <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700 mb-2">LinkedIn</label>
            <input id="linkedin" type="text" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm" />
        </div>
        <div className="mb-4">
            <label htmlFor="instagram" className="block text-sm font-medium text-gray-700 mb-2">Instagram</label>
            <input id="instagram" type="text" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm" defaultValue="https://www.instagram.com/user" />
        </div>
    </div>
);

const ConnectionsTab = () => (
    <div>
        <button type="button" className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600">Connect to Twitter</button>
        <hr className="my-6" />
        <div>
            <h5 className="text-lg font-medium mb-2">
                <button type="button" className="float-right text-gray-500 text-xs">Remove</button>
                You are connected to Google:
            </h5>
            <a href="#!">[email protected]</a>
        </div>
        <hr className="my-6" />
        <button type="button" className="px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800">Connect to Facebook</button>
        <hr className="my-6" />
        <button type="button" className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900">Connect to Instagram</button>
    </div>
);

const NotificationsTab = () => (
    <div>
        <h6 className="text-lg font-medium mb-4">Activity</h6>
        <div className="mb-4">
            <label className="flex items-center">
                <input type="checkbox" className="form-checkbox" defaultChecked />
                <span className="ml-2">Email me when someone comments on my article</span>
            </label>
        </div>
        <div className="mb-4">
            <label className="flex items-center">
                <input type="checkbox" className="form-checkbox" defaultChecked />
                <span className="ml-2">Email me when someone answers on my forum thread</span>
            </label>
        </div>
        <div className="mb-4">
            <label className="flex items-center">
                <input type="checkbox" className="form-checkbox" />
                <span className="ml-2">Email me when someone follows me</span>
            </label>
        </div>
        <hr className="my-6" />
        <h6 className="text-lg font-medium mb-4">Application</h6>
        <div className="mb-4">
            <label className="flex items-center">
                <input type="checkbox" className="form-checkbox" defaultChecked />
                <span className="ml-2">News and announcements</span>
            </label>
        </div>
        <div className="mb-4">
            <label className="flex items-center">
                <input type="checkbox" className="form-checkbox" />
                <span className="ml-2">Weekly product updates</span>
            </label>
        </div>
        <div className="mb-4">
            <label className="flex items-center">
                <input type="checkbox" className="form-checkbox" defaultChecked />
                <span className="ml-2">Weekly blog digest</span>
            </label>
        </div>
    </div>
);
