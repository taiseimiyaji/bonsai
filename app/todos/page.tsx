import { auth } from "@/auth";
import { redirect } from "next/navigation";
import TodosPageClient from "./TodosPage.client";

export default async function TodosIndexPage() {
	const session = await auth();
	
	console.log('TODO Page - Session check:', {
		hasSession: !!session,
		hasUser: !!session?.user,
		userId: session?.user?.id,
		userEmail: session?.user?.email,
	});
	
	if (!session?.user?.id) {
		console.log('TODO Page - Redirecting to signin: No valid session');
		redirect("/auth/signin");
	}
	const userId = session.user.id;
	
	return (
		<div className="min-h-screen bg-gray-900">
			<TodosPageClient initialTodos={[]} userId={userId} />
		</div>
	);
}
