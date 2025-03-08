import Profile from "@/components/User/Profile";
import AuthGuard from "../../../../AuthGuard";


export default function ProfilePage() {
  return (
    <AuthGuard>
      <Profile />
    </AuthGuard>
  );
}