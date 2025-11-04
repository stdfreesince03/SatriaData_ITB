import Image from "next/image";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 px-6 py-2 bg-white">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4 text-sm text-gray-600">
        {/*<div className="flex items-center gap-2">*/}
        {/*    <Image src='/itb_full_logo.png' alt={"Logo ITB"}  width={32}*/}
        {/*           height={32}*/}
        {/*           className="h-20 w-auto"*/}
        {/*           priority/>*/}
        {/*</div>*/}

        {/*<div className="flex items-center gap-6">*/}
        {/*    <Image src='/stei_itb.png' alt={"Logo ITB"}  width={48}*/}
        {/*           height={48}*/}
        {/*           className="h-30 w-auto"*/}
        {/*           priority/>*/}
        {/*</div>*/}
      </div>
    </footer>
  );
}
