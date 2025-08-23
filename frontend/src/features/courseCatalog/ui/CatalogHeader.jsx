/* eslint-disable react/prop-types */
import React from "react";
import backImg from "../../../shared/assets/images/course_catlog/default-cover.webp";

export default function CatalogHeader({
    title = "Course Catalog",
    subtitle = "Phoenix and LiveView applications are awesome on Fly.io! This is the home for Phoenix-oriented content ranging from Ecto to LiveView and more.",
    background = "/shared/assets/images/course_catlog/default-cover.webp",
}) {
    return (
        <header className="relative -mt-24 pt-36 md:py-35 pb-20 text-white text-center overflow-hidden">
            <img
                src={backImg}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-70"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-[#150731] via-[#331342] to-[#340e24] opacity-60" />

            <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 mt-35">
                <h1 className="font-heading text-3xl xs:text-3.5xl sm:text-4xl md:text-4.5xl lg:text-5xl xl:text-5.5xl !tracking-[-.045em] relative text-navy mb-5 -mt-4 sm:-mt-5 lg:-mt-6 xl:mt-[-26px] leading-tight/[1.15]">
                    {title}
                </h1>
                <p className="text-sm sm:text-base lg:text-[18px] tracking-prose mb-9 max-w-[46.875rem] mx-auto text-[#e0e0e0]">
                    {subtitle}
                </p>
            </div>
        </header>
    );
}
