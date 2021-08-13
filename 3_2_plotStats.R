## For any issue/bug, please write to dhemerson.costa@ipam.org.br or edriano.souza@ipam.org.br
## Developed by: IPAM, SEEG and OC
## Citing: SEEG/Observatório do Clima and IPAM

## Load libraries
library(dplyr)
library(ggplot2)
library(tidyr)
library(reshape2)

## avoid scientific notations
options(scipen=999)

## Define table
data <- read.csv('../table/rect_statistics.csv')

## Define function to adjust labels
setNames <- function (list) {
  return(
    gsub("Sï¿½o", "São",
         gsub("Chapadï¿½o", "Chapadão",
              gsub("Paranï¿½", "Paraná",
                   gsub("Guimarï¿½es", "Guimarães",
                        gsub("Parnaï¿½ba", "Paraíba",
                             gsub("Depressï¿½o", "Depressão",
                                  gsub("Vï¿½o", "Vão",
                                       gsub("Parnaguï¿½", "Parnaguá",
                                            gsub("Cï¿½rstica", "Cárstica",
                                                 list))))))))))
  
}

## Define function to 'filter' structure table from GEE
filterTab <- function(table) {
  ## remove undesirable columns
  x <- table[ , -which(names(table) %in% c("system.index","AREA", "AREA_HA", "CLASSIFY", "gpp_mean", "gpp_stdev", ".geo"))]
  
  return(x)
}

## Filter table
data <- filterTab(table = data)

## Rect ecoregion names
data$NOME <- setNames(list = data$NOME)

## Plot sum
ggplot(data, aes(x= year, y= ct_sum, colour= as.factor(design))) +
  stat_summary(fun='sum', geom='line') +
  stat_summary(fun='sum', geom='point') +
  scale_colour_manual('version', values=c('red', 'blue')) +
  theme_bw() +
  xlab('Year') + ylab('CT') 
  #facet_wrap(~NOME)

## Plot mean
#ggplot(data, aes(x= year, y= ct_mean, colour= as.factor(design))) +
#  stat_summary(fun='mean', geom='line') +
#  stat_summary(fun='mean', geom='point') +
#  scale_colour_manual('version', values=c('red', 'blue')) +
#  theme_bw() +
#  xlab('Year') + ylab('CT') 
  #facet_wrap(~NOME)


