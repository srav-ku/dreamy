import { Link } from "wouter";
import { useListPersons } from "@/lib/api";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function PersonsList() {
  const { data: persons, isLoading } = useListPersons();

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Persons</h1>
        <Link href="/persons/new">
          <Button className="rounded-full bg-white text-black hover:bg-[#eff3f4] font-bold px-4">
            + New person
          </Button>
        </Link>
      </div>

      <div className="space-y-0">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 py-4 border-b border-[#2F3336]">
                <Skeleton className="h-12 w-12 rounded-full bg-[#2F3336]" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32 bg-[#2F3336]" />
                  <Skeleton className="h-3 w-48 bg-[#2F3336]" />
                </div>
              </div>
            ))}
          </div>
        ) : persons?.length === 0 ? (
          <div className="text-center py-12 text-[#71767B]">
            <p>No persons yet.</p>
          </div>
        ) : (
          persons?.map((person) => (
            <div key={person.id} className="flex items-center gap-4 py-4 border-b border-[#2F3336] hover:bg-white/[0.03] transition-colors -mx-4 px-4 cursor-pointer group">
              <Avatar className="h-12 w-12 border border-[#2F3336]">
                <AvatarImage src={person.profile_image || undefined} alt={person.name} className="object-cover" />
                <AvatarFallback className="bg-[#16181C] text-[#71767B]">{person.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <Link href={`/persons/${person.id}/albums`} className="block">
                  <div className="font-bold truncate group-hover:underline decoration-[#71767B] underline-offset-4">{person.name}</div>
                  {person.bio && (
                    <div className="text-[#71767B] text-sm truncate">{person.bio}</div>
                  )}
                </Link>
              </div>
              <Link href={`/persons/${person.id}/edit`}>
                <Button variant="outline" size="sm" className="rounded-full border-[#2F3336] text-white hover:bg-white/10 bg-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  Edit
                </Button>
              </Link>
            </div>
          ))
        )}
      </div>
    </Layout>
  );
}
