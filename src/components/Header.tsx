import { Link } from "react-router-dom";
import { Logo } from "./Logo";
import { MobileMenu } from "./MobileMenu";
export const Header = () => {
  return <div className="fixed z-50 pt-8 md:pt-14 top-0 left-0 w-full">
      <header className="flex items-center justify-between container max-w-7xl mx-auto px-4 md:px-6">
        <Link to="/">
          
        </Link>
        <nav className="flex max-lg:hidden absolute left-1/2 -translate-x-1/2 items-center justify-center gap-x-10">
          {[{
          name: "Simulator",
          path: "/simulator"
        }, {
          name: "Lessons",
          path: "/lessons"
        }, {
          name: "Missions",
          path: "/missions"
        }, {
          name: "AI Coach",
          path: "/ai-coach"
        }].map(item => <Link className="uppercase inline-block font-mono text-foreground/60 hover:text-foreground/100 duration-150 transition-colors ease-out" to={item.path} key={item.name}>
              {item.name}
            </Link>)}
        </nav>
        <Link className="uppercase max-lg:hidden transition-colors ease-out duration-150 font-mono text-primary hover:text-primary/80" to="/auth">
          Sign In
        </Link>
        <MobileMenu />
      </header>
    </div>;
};