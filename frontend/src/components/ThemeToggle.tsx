import { useTheme } from "../hooks/useTheme";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  return (
    <button className="btn btn-ghost" onClick={toggle} type="button">
      {theme === "dark" ? "Light mode" : "Dark mode"}
    </button>
  );
}
