export const ART_STYLES = [
  "Marvel",
  "Disney",
  "Ghibli",
  "Lego",
  "Toriyama",
  "Chibi / Super Deformed",
  "Ligne Claire",
  "90s Cel-Shaded Anime",
  "CalArts",
  "Ukiyo-e",
  "90s Mecha",
  "Classic Shonen",
  "Shojo",
  "Sanrio",
  "Pokemon",
] as const;

export type ArtStyle = (typeof ART_STYLES)[number];

export type AvatarGender = "male" | "female";
export type AvatarIndex = 1 | 2;

export type Avatar = {
  url: string;
  style: ArtStyle;
  gender: AvatarGender;
  index: AvatarIndex;
};

export const AVATARS: readonly Avatar[] = [
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/marvel/male-1-S26gt940OJ2pqJgPAsXiJtU3m47VdX.webp", style: "Marvel", gender: "male", index: 1 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/marvel/male-2-2bTtqGp3bNbTbQhJZJoC6kccJRgtdK.webp", style: "Marvel", gender: "male", index: 2 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/marvel/female-1-5EjqMaJspe0gNtgdwgklAIz2efQxjD.webp", style: "Marvel", gender: "female", index: 1 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/marvel/female-2-6bi8pic68DdzBInoeGZkOGdKUhizAL.webp", style: "Marvel", gender: "female", index: 2 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/disney/male-1-YwPCPmTKxXllLScz5HOIGpgKi0RE96.webp", style: "Disney", gender: "male", index: 1 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/disney/male-2-IzG295rWaQEn9FGiTTTCHKUaiuGDNl.webp", style: "Disney", gender: "male", index: 2 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/disney/female-1-KlycdjC4cKVWminCZAvBV0tBH0SpSc.webp", style: "Disney", gender: "female", index: 1 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/disney/female-2-oAIeWXYj6RT3fFgSm2ybJvCNQqgW7P.webp", style: "Disney", gender: "female", index: 2 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/ghibli/male-1-Ncqr8bHw9HEMHG0ugbkNIeCAfY1Dg2.webp", style: "Ghibli", gender: "male", index: 1 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/ghibli/male-2-Y2Y5bRIxtwAHBag0JhOBxUaQP1KvEG.webp", style: "Ghibli", gender: "male", index: 2 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/ghibli/female-1-CT7g2bn01AZwQmFw02Q9IU7aG58Ilr.webp", style: "Ghibli", gender: "female", index: 1 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/ghibli/female-2-NAWdNBlqWr7685uTzkGtG6Mdur7UaR.webp", style: "Ghibli", gender: "female", index: 2 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/lego/male-1-zb7c0BqYb78ZFUHn8nfAY4qdokfltw.webp", style: "Lego", gender: "male", index: 1 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/lego/male-2-9Jl3JfyphOWhZvwMKyk8cOybK1Kgz4.webp", style: "Lego", gender: "male", index: 2 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/lego/female-1-QRUtpndABg9cyflZIGH9YXqyOs48AM.webp", style: "Lego", gender: "female", index: 1 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/lego/female-2-Irr75L6ss5wJWMqHQVvPdZiOkS4sRl.webp", style: "Lego", gender: "female", index: 2 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/toriyama/male-1-evAC52jgdiHrd583Q4VBVYReHaGnnH.webp", style: "Toriyama", gender: "male", index: 1 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/toriyama/male-2-KTlil5BEvJrFc3C8B1MDLfk287X1TW.webp", style: "Toriyama", gender: "male", index: 2 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/toriyama/female-1-kxBITHgHi646pga6qnPttLciSWJqXl.webp", style: "Toriyama", gender: "female", index: 1 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/toriyama/female-2-z94ikVQPUGwBGtxsLNDdwbwhXy2TdI.webp", style: "Toriyama", gender: "female", index: 2 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/chibi-super-deformed/male-1-G0SCV0Z4KPHJNLNzE0zyQtqQu5fMAa.webp", style: "Chibi / Super Deformed", gender: "male", index: 1 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/chibi-super-deformed/male-2-DidOlhrchFXb2j5wOLPKG3ZpGGTGc9.webp", style: "Chibi / Super Deformed", gender: "male", index: 2 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/chibi-super-deformed/female-1-SbB49tawNWG0kIrEY0fWH7aNpux236.webp", style: "Chibi / Super Deformed", gender: "female", index: 1 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/chibi-super-deformed/female-2-mXPS8cQ0IPHcDqWrj6dstf90UP8a13.webp", style: "Chibi / Super Deformed", gender: "female", index: 2 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/ligne-claire/male-1-WHf2SWvmYa4fGGlDt4CuVjgQHxC4JI.webp", style: "Ligne Claire", gender: "male", index: 1 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/ligne-claire/male-2-OJ2YVrmMzmvDSAaoXuk5lqL3MxzGs4.webp", style: "Ligne Claire", gender: "male", index: 2 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/ligne-claire/female-1-vsQdLJVHKZDxPWBAQNoyOBXMjcaxn2.webp", style: "Ligne Claire", gender: "female", index: 1 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/ligne-claire/female-2-Mw7MdLmrBKBXnq0IfaSZL7GfBN8CfF.webp", style: "Ligne Claire", gender: "female", index: 2 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/90s-cel-shaded-anime/male-1-X857GVfyCLCxPJJdaFoVr4nLkwkNTv.webp", style: "90s Cel-Shaded Anime", gender: "male", index: 1 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/90s-cel-shaded-anime/male-2-PiVgE2mwJXjKdRLFy2BrRzk8NJqo5l.webp", style: "90s Cel-Shaded Anime", gender: "male", index: 2 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/90s-cel-shaded-anime/female-1-5kxLNjM8IiRuezAFTYpS9mYYhDnUa9.webp", style: "90s Cel-Shaded Anime", gender: "female", index: 1 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/90s-cel-shaded-anime/female-2-fgPqkO1amY80wdpW1qdI1lY3Aq4oiP.webp", style: "90s Cel-Shaded Anime", gender: "female", index: 2 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/calarts/male-1-9n6KHYchimoiQqwIxsazloT06H4PmW.webp", style: "CalArts", gender: "male", index: 1 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/calarts/male-2-EPiZnu82HhZaf4qYWALImBl8ZO92cn.webp", style: "CalArts", gender: "male", index: 2 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/calarts/female-1-Hcvm6z6kCdnDhgkukpNzef96mIaf6T.webp", style: "CalArts", gender: "female", index: 1 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/calarts/female-2-rz8BoXoiIb7PNjaUZY7IGl97h3pHSU.webp", style: "CalArts", gender: "female", index: 2 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/ukiyo-e/male-1-WMx2RcXratV3yNXeiv4r3gOgE6D42l.webp", style: "Ukiyo-e", gender: "male", index: 1 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/ukiyo-e/male-2-Dv8OLWxmK9LnD5z1dDwfZ1n9UpNQFu.webp", style: "Ukiyo-e", gender: "male", index: 2 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/ukiyo-e/female-1-bIvTwI2zpVTqnYHqjLLTprZAcxD3HC.webp", style: "Ukiyo-e", gender: "female", index: 1 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/ukiyo-e/female-2-1BetMZNYuxoY3N54QuOoBaf5Mn76yd.webp", style: "Ukiyo-e", gender: "female", index: 2 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/90s-mecha/male-1-w6MNcAa1LjKjyFoxLUOwJBoTUVjv94.webp", style: "90s Mecha", gender: "male", index: 1 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/90s-mecha/male-2-XnJhKG7wEIULFF1iFlCEQwIWzpPrqk.webp", style: "90s Mecha", gender: "male", index: 2 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/90s-mecha/female-1-z5hc8gw52pPUVS36Vw9bXyhUcfOlS8.webp", style: "90s Mecha", gender: "female", index: 1 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/90s-mecha/female-2-NIytI0sIwUumShMPU90dTI4r8l5lIo.webp", style: "90s Mecha", gender: "female", index: 2 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/classic-shonen/male-1-aq9TCVGvgl6zmudxL8DkY2tIXwr75Z.webp", style: "Classic Shonen", gender: "male", index: 1 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/classic-shonen/male-2-jLfhBdy7x1ZCwjT2bolbNw3qu5UBAm.webp", style: "Classic Shonen", gender: "male", index: 2 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/classic-shonen/female-1-EecYoCexYKANap9MvhudcW6HC2kgji.webp", style: "Classic Shonen", gender: "female", index: 1 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/classic-shonen/female-2-VJau9xphtMvozQrloIQihoDubic7qG.webp", style: "Classic Shonen", gender: "female", index: 2 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/shojo/male-1-6lfced5Ek6j17asQbKuihFrZ0D51no.webp", style: "Shojo", gender: "male", index: 1 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/shojo/male-2-DJwnXg5pPQZ8M97ELCaKBt2RDK2aoZ.webp", style: "Shojo", gender: "male", index: 2 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/shojo/female-1-I1NSTK9oYhN69DcJaOXPelfqnc2VFA.webp", style: "Shojo", gender: "female", index: 1 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/shojo/female-2-Nw2g2OucNnw0lXwXlsdIvoa9S5lj8h.webp", style: "Shojo", gender: "female", index: 2 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/sanrio/male-1-5DYkSVD0UBzGwnw5PI8srI5DDSACrK.webp", style: "Sanrio", gender: "male", index: 1 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/sanrio/male-2-jjLNznKKdDw7kuhIJ1jsokjF98ghIT.webp", style: "Sanrio", gender: "male", index: 2 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/sanrio/female-1-4gyPqBcJjsROybSf1ppj64jaib4Asb.webp", style: "Sanrio", gender: "female", index: 1 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/sanrio/female-2-tPiQMhkuXcecvkskNlvOVYxRE6vqqT.webp", style: "Sanrio", gender: "female", index: 2 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/pokemon/male-1-G4HEhaRLKCaokHYLknlWMzktFy9mxN.webp", style: "Pokemon", gender: "male", index: 1 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/pokemon/male-2-lvsJxzpxjhb94gxIeWYoGnaHLiuhnN.webp", style: "Pokemon", gender: "male", index: 2 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/pokemon/female-1-mghnstYc034nNwdmabWUqybZvkekHB.webp", style: "Pokemon", gender: "female", index: 1 },
  { url: "https://yusjv55gwdfjuzmc.public.blob.vercel-storage.com/avatars/pokemon/female-2-84WUKhCsrvFVdEBu76m8lMygbwu0X7.webp", style: "Pokemon", gender: "female", index: 2 },
];

const AVATAR_URLS: ReadonlySet<string> = new Set(AVATARS.map((a) => a.url));

export function isKnownAvatarUrl(url: unknown): url is string {
  return typeof url === "string" && AVATAR_URLS.has(url);
}

export function styleSlug(style: ArtStyle): string {
  return style
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
