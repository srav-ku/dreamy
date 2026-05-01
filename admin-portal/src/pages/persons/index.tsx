import { useState } from "react";
import { Link } from "wouter";
import { useListPersons, useDeletePerson } from "@/lib/api";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trash2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function PersonsList() {
  const { data: persons, isLoading } = useListPersons();
  const deletePerson = useDeletePerson();
  const [search, setSearch] = useState("");

  const filteredPersons = persons?.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    (p.bio?.toLowerCase().includes(search.toLowerCase()))
  );

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

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71767B]" />
        <Input 
          placeholder="Search persons..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-[#16181C] border-[#2F3336] focus:border-[#1d9bf0] transition-colors rounded-xl text-white h-11"
        />
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
        ) : filteredPersons?.length === 0 ? (
          <div className="text-center py-12 text-[#71767B]">
            <p>{search ? `No persons matching "${search}"` : "No persons yet."}</p>
          </div>
        ) : (
          filteredPersons?.map((person) => (
            <div key={person.id} className="flex items-center gap-4 py-4 border-b border-[#2F3336] hover:bg-white/[0.03] transition-colors -mx-4 px-4 cursor-pointer group">
              <Link href={`/persons/${person.id}/albums`} className="flex-1 flex items-center gap-4 min-w-0">
                <Avatar className="h-12 w-12 border border-[#2F3336]">
                  <AvatarImage src={person.profile_image || undefined} alt={person.name} className="object-cover" />
                  <AvatarFallback className="bg-[#16181C] text-[#71767B]">{person.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate group-hover:underline decoration-[#71767B] underline-offset-4">{person.name}</div>
                  {person.bio && (
                    <div className="text-[#71767B] text-sm truncate">{person.bio}</div>
                  )}
                </div>
              </Link>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link href={`/persons/${person.id}/edit`}>
                  <Button variant="outline" size="sm" className="rounded-full border-[#2F3336] text-white hover:bg-white/10 bg-transparent">
                    Edit
                  </Button>
                </Link>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full text-[#f4212e] hover:bg-[#f4212e]/10 hover:text-[#f4212e]">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="bg-black border-[#2F3336] text-white">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete {person.name}?</AlertDialogTitle>
                      <AlertDialogDescription className="text-[#71767B]">
                        This will permanently delete this person and all their albums and photos. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="bg-transparent border-[#2F3336] text-white hover:bg-white/10 rounded-full">Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => deletePerson.mutate(person.id)}
                        className="bg-[#f4212e] text-white hover:bg-[#d7202b] rounded-full font-bold"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))
        )}
      </div>
    </Layout>
  );
}
