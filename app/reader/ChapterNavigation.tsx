"use client";

import Link from "next/link";
import { IoArrowBack, IoArrowForward } from "react-icons/io5";
import styles from "./ChapterNavigation.module.css";

type Chapter = {
  id: string;
  chapter: string;
  title: string;
};

type Props = {
  currentChapter: string;
  chapters: Chapter[];
  mangaId: string;
};

export default function ChapterNavigation({
  currentChapter,
  chapters,
  mangaId,
}: Props) {
  if (!chapters || chapters.length === 0) {
    return null;
  }

  const currentChapterNum = parseInt(currentChapter);
  
  // Find previous and next chapters
  const prevChapter = chapters.find(
    (ch) => parseInt(ch.chapter) === currentChapterNum - 1
  );
  const nextChapter = chapters.find(
    (ch) => parseInt(ch.chapter) === currentChapterNum + 1
  );

  return (
    <div className={styles["chapter-nav-container"]}>
      <div className={styles["chapter-nav-content"]}>
        {/* Previous Chapter */}
        {prevChapter ? (
          <Link
            href={`/reader/${mangaId}/${prevChapter.chapter}`}
            className={styles["nav-button"] + " " + styles["prev-button"]}
          >
            <div className={styles["nav-label"]}>
              <span className={styles["nav-text"]}>Previous Chapter</span>
              <span className={styles["nav-chapter"]}>Ch. {prevChapter.chapter}</span>
            </div>
            <IoArrowBack className={styles["nav-icon"]} />
          </Link>
        ) : (
          <div className={styles["nav-button"] + " " + styles["prev-button"] + " " + styles["disabled"]}>
            <div className={styles["nav-label"]}>
              <span className={styles["nav-text"]}>No Previous</span>
              <span className={styles["nav-chapter"]}>First Chapter</span>
            </div>
            <IoArrowBack className={styles["nav-icon"]} />
          </div>
        )}

        {/* Next Chapter */}
        {nextChapter ? (
          <Link
            href={`/reader/${mangaId}/${nextChapter.chapter}`}
            className={styles["nav-button"] + " " + styles["next-button"]}
          >
            <div className={styles["nav-label"]}>
              <span className={styles["nav-text"]}>Next Chapter</span>
              <span className={styles["nav-chapter"]}>Ch. {nextChapter.chapter}</span>
            </div>
            <IoArrowForward className={styles["nav-icon"]} />
          </Link>
        ) : (
          <div className={styles["nav-button"] + " " + styles["next-button"] + " " + styles["disabled"]}>
            <div className={styles["nav-label"]}>
              <span className={styles["nav-text"]}>No Next</span>
              <span className={styles["nav-chapter"]}>Latest Chapter</span>
            </div>
            <IoArrowForward className={styles["nav-icon"]} />
          </div>
        )}
      </div>
    </div>
  );
}
