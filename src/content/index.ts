import type { AgeGroup, Theme } from "@/types/content";
import animaux from "./themes/animaux.json";
import couleurs from "./themes/couleurs.json";
import nombres from "./themes/nombres.json";
import famille from "./themes/famille.json";
import nourriture from "./themes/nourriture.json";
import fruitsLegumes from "./themes/fruits-legumes.json";
import ecole from "./themes/ecole.json";
import corps from "./themes/corps.json";
import meteo from "./themes/meteo.json";
import vetements from "./themes/vetements.json";
import maison from "./themes/maison.json";
import transports from "./themes/transports.json";
import sport from "./themes/sport.json";
import emotions from "./themes/emotions.json";
import jours from "./themes/jours.json";
import saisons from "./themes/saisons.json";
import formes from "./themes/formes.json";
import nature from "./themes/nature.json";
import jouets from "./themes/jouets.json";
import musique from "./themes/musique.json";
import metiers from "./themes/metiers.json";
import ferme from "./themes/ferme.json";
import ocean from "./themes/ocean.json";
import espace from "./themes/espace.json";

export const themes: Theme[] = [
  animaux,
  couleurs,
  nombres,
  famille,
  nourriture,
  fruitsLegumes,
  ecole,
  corps,
  meteo,
  vetements,
  maison,
  transports,
  sport,
  emotions,
  jours,
  saisons,
  formes,
  nature,
  jouets,
  musique,
  metiers,
  ferme,
  ocean,
  espace,
] as Theme[];

export function getTheme(themeId: string): Theme | undefined {
  return themes.find((theme) => theme.id === themeId);
}

export function wordsForAge(theme: Theme, age: AgeGroup) {
  return theme.words.filter((word) => word.ageGroups.includes(age));
}
