import Dashboard from "./Dashboard";

export const metadata = { title: "OpenWhoop — Dashboard" };

// Dashboard is a client component; Web Bluetooth / IndexedDB only run in the
// browser (inside effects), so the server render is just the static shell.
export default function AppPage() {
  return <Dashboard />;
}
