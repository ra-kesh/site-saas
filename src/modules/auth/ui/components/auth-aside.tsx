import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const testimonial = {
  quote:
    "Sites of Puri has transformed how we launch ideas. The builder is intuitive and incredibly powerful.",
  author: {
    name: "Sarah Chen",
    role: "Product Manager",
    avatar: "/avatars/sarah.jpg",
  },
};

const authorInitials = testimonial.author.name
  .split(" ")
  .map((segment) => segment[0])
  .join("")
  .slice(0, 2)
  .toUpperCase();

export function AuthAside() {
  return (
    <div className="relative hidden overflow-hidden bg-gradient-to-b from-primary via-primary/90 to-primary/80 lg:flex">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(255,255,255,0.12),transparent_52%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(255,255,255,0.08),transparent_50%)]" />
      <div className="relative flex flex-col justify-center p-12 text-primary-foreground">
        <div className="max-w-md space-y-8">
          <svg
            aria-hidden="true"
            className="h-10 w-10 text-primary-foreground/70"
            fill="currentColor"
            viewBox="0 0 32 32"
          >
            <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
          </svg>
          <p className="text-lg leading-relaxed text-primary-foreground/95">
            {testimonial.quote}
          </p>
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-primary-foreground/20">
              <AvatarImage
                alt={testimonial.author.name}
                src={testimonial.author.avatar}
              />
              <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground">
                {authorInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-primary-foreground">
                {testimonial.author.name}
              </p>
              <p className="text-primary-foreground/80 text-sm">
                {testimonial.author.role}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
