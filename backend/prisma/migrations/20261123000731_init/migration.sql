-- CreateEnum
CREATE TYPE "HuntStatus" AS ENUM ('PLANNED', 'ACTIVE', 'COMPLETED', 'PAUSED');

-- CreateTable
CREATE TABLE "PokemonSpecies" (
    "id" SERIAL NOT NULL,
    "nationalDexNumber" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "generation" INTEGER NOT NULL,
    "genus" TEXT,
    "description" TEXT,
    "color" TEXT,
    "habitat" TEXT,
    "isBaby" BOOLEAN NOT NULL DEFAULT false,
    "isLegendary" BOOLEAN NOT NULL DEFAULT false,
    "isMythical" BOOLEAN NOT NULL DEFAULT false,
    "evolutionChainId" INTEGER,

    CONSTRAINT "PokemonSpecies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DexEntry" (
    "id" SERIAL NOT NULL,
    "speciesId" INTEGER NOT NULL,
    "pokeApiPokemonId" INTEGER,
    "formKey" TEXT NOT NULL DEFAULT 'standard',
    "displayName" TEXT NOT NULL,
    "region" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "primaryType" TEXT NOT NULL,
    "secondaryType" TEXT,
    "abilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "hiddenAbility" TEXT,
    "height" INTEGER,
    "weight" INTEGER,
    "hp" INTEGER,
    "attack" INTEGER,
    "defense" INTEGER,
    "specialAttack" INTEGER,
    "specialDefense" INTEGER,
    "speed" INTEGER,
    "spriteDefault" TEXT,
    "spriteShiny" TEXT,
    "artworkDefault" TEXT,
    "artworkShiny" TEXT,

    CONSTRAINT "DexEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OwnedPokemon" (
    "id" SERIAL NOT NULL,
    "dexEntryId" INTEGER NOT NULL,
    "nickname" TEXT,
    "gameOrigin" TEXT,
    "obtainedAt" TIMESTAMP(3),
    "isInHome" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OwnedPokemon_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hunt" (
    "id" SERIAL NOT NULL,
    "dexEntryId" INTEGER NOT NULL,
    "game" TEXT,
    "method" TEXT,
    "status" "HuntStatus" NOT NULL DEFAULT 'PLANNED',
    "encounters" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hunt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PokemonSpecies_nationalDexNumber_key" ON "PokemonSpecies"("nationalDexNumber");

-- CreateIndex
CREATE INDEX "PokemonSpecies_name_idx" ON "PokemonSpecies"("name");

-- CreateIndex
CREATE INDEX "PokemonSpecies_generation_idx" ON "PokemonSpecies"("generation");

-- CreateIndex
CREATE UNIQUE INDEX "DexEntry_pokeApiPokemonId_key" ON "DexEntry"("pokeApiPokemonId");

-- CreateIndex
CREATE INDEX "DexEntry_speciesId_idx" ON "DexEntry"("speciesId");

-- CreateIndex
CREATE INDEX "DexEntry_displayName_idx" ON "DexEntry"("displayName");

-- CreateIndex
CREATE INDEX "DexEntry_primaryType_idx" ON "DexEntry"("primaryType");

-- CreateIndex
CREATE INDEX "DexEntry_secondaryType_idx" ON "DexEntry"("secondaryType");

-- CreateIndex
CREATE INDEX "DexEntry_region_idx" ON "DexEntry"("region");

-- CreateIndex
CREATE UNIQUE INDEX "DexEntry_speciesId_formKey_key" ON "DexEntry"("speciesId", "formKey");

-- CreateIndex
CREATE INDEX "OwnedPokemon_dexEntryId_idx" ON "OwnedPokemon"("dexEntryId");

-- CreateIndex
CREATE INDEX "Hunt_dexEntryId_idx" ON "Hunt"("dexEntryId");

-- AddForeignKey
ALTER TABLE "DexEntry" ADD CONSTRAINT "DexEntry_speciesId_fkey" FOREIGN KEY ("speciesId") REFERENCES "PokemonSpecies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnedPokemon" ADD CONSTRAINT "OwnedPokemon_dexEntryId_fkey" FOREIGN KEY ("dexEntryId") REFERENCES "DexEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hunt" ADD CONSTRAINT "Hunt_dexEntryId_fkey" FOREIGN KEY ("dexEntryId") REFERENCES "DexEntry"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
