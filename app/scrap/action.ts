"use server";
import { prisma } from "@/prisma/prisma";

export async function getScrap({ userId }: { userId: string | undefined }) {
	const scraps = await prisma.scrap.findMany({
		where: { userId },
		orderBy: { createdAt: "desc" },
	});
	// snapsをシリアライズして返す
	const snapsFormatted = scraps.map((scrap) => {
		return {
			...scrap,
			createdAt: scrap.createdAt.toISOString(),
			updatedAt: scrap.updatedAt.toISOString(),
		};
	});
	return scraps;
}
