import { span } from "framer-motion/client";

type Props = {
  // `searchParams` may be a Promise in newer Next.js runtimes, so keep this flexible
  searchParams?: any;
};

export default async function CraftPage({ searchParams }: Props) {
  const params = await searchParams;
  const modeRaw = params?.mode;
  const mode = Array.isArray(modeRaw) ? modeRaw[0] : modeRaw;
  const isDev = mode === "dev";

  const title = "Local Tool — Coming Soon";
  const message = <>
    We are making a software which allows you to translate the panels of your favourite{" "}
    <span style={{ color: "#AE4AFF" , fontSize:"15px" }}>
      Manhua / Manhwa / Manga
    </span>{" "}
    quickly in their own native language (Default - English) and pretty efficiently
    with all the text <span style={{ color: "#AE4AFF"}}>
        customizations / water marks removal / variety fonts
        </span>{" "} etc.
    We will provide you all the steps to run it locally so that <span style={{ color: "#AE4AFF"}}>
        your data keeps secure to you only</span>{" "}.
    It's currently in development (dev mode). Once it ends we will release it quickly.
  </> ;

  return (
    <div className="craft-page">
      <div className="craft-card">
        <div className="craft-pill">{isDev ? "Development" : "Preview"}</div>
        <h1 className="craft-title">{title}</h1>
        <p className="craft-sub">{message}</p>
        <p className="craft-note">
            <span className="text-xl font-bold font-sans text-white">
            Important Note</span>
            <p>
                We are planning to make this platform as a <span style={{ color: "#AE4AFF"}}>community-driven translation workspace</span> designed specifically for manhua, manhwa, and manga. Users can run the translation tool locally to process panels into English (Or their native language), while also participating in <span style={{ color: "#AE4AFF"}}>collaborative projects (Manhua / Manhwa / Manga Series)</span> organized by series. Each project represents a full workspace, where contributors coordinate to divide chapters, translate new releases quickly, and maintain consistency in terminology and tone. The goal is to accelerate <span style={{ color: "#AE4AFF"}}>high-quality translations through structured teamwork</span>, allowing multiple contributors to work in parallel while building a shared, organized translation community around their favorite series ~ <span style={{fontStyle:'italic' , fontWeight:'bold'}}>Dev Team</span>
            </p>
        </p>
      </div>
    </div>
  );
}
