import { ActionFunctionArgs, json } from "@remix-run/node";
import { Form, useActionData, useLoaderData } from "@remix-run/react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { db } from "@/lib/db";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const schema = z.object({
  title: z.string().min(1, "Title must be at least 1 character"),
  content: z.string().min(1, "Content must be at least 1 character"),
});

export async function action({ request }: ActionFunctionArgs) {
  if (request.method === "DELETE") {
    const id = (await request.formData()).get("id");
    if (!id) return json({ message: "Post not found!" }, { status: 404 });
    await db.post.delete({ where: { id: Number(id) } });
    return json({ message: "Post deleted!" }, { status: 200 });
  }
  const data = schema.safeParse(Object.fromEntries(await request.formData()));
  if (!data.success)
    return json(data.error.flatten().fieldErrors, { status: 400 });

  await db.post.create({ data: data.data });
  return json({ message: "Post created!" }, { status: 201 });
}

export async function loader() {
  const posts = await db.post.findMany();
  return json(posts);
}

const Page: React.FC = () => {
  const errors = useActionData<typeof action>();
  const posts = useLoaderData<typeof loader>();

  return (
    <main className="container">
      <Form method="POST" className="space-y-4">
        <div className="space-y-1">
          <Label htmlFor="title">Title</Label>
          <Input type="text" name="title" />
          {errors && "title" in errors && (
            <p className="text-destructive text-sm">{errors.title}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label htmlFor="content">Content</Label>
          <Input type="text" name="content" />
          {errors && "content" in errors && (
            <p className="text-destructive text-sm">{errors.content}</p>
          )}
        </div>

        <Button>Create</Button>
      </Form>

      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {posts.map((post) => (
          <li key={post.id}>
            <Card>
              <CardHeader>
                <CardTitle>{post.title}</CardTitle>
                <CardDescription>{post.content}</CardDescription>
              </CardHeader>

              <CardFooter>
                <Form method="DELETE">
                  <input type="hidden" name="id" value={post.id} />
                  <Button>Delete</Button>
                </Form>
              </CardFooter>
            </Card>
          </li>
        ))}
      </ul>
    </main>
  );
};

export default Page;
