## Plot pixel count by comparing QCN and MapBiomas collection 5.0 LCLUC maps
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
data <- read.csv('../table/qcn_pixel_count.csv')

## Define function to convert IDS to stings
setClasses <- function (list) {
  x <- gsub("X", "", list)
  x <- gsub("^12$", "Grassland",
            gsub("^15$", "Pasture",
                 gsub("^20$", "Sugar-cane",
                      gsub("^21$", "Mosaic of",
                           gsub("^25$", "ONVA",
                                gsub("^29$", "Rocky",
                                     gsub("^3$", "Forest",
                                          gsub("^30$", "Mining",
                                               gsub("^33$", "Water",
                                                    gsub("^36$", "Perennial crop",
                                                         gsub("^4$", "Savanna",
                                                              gsub("^41$", "Temporary crop",
                                                                   gsub("^9$", "Forestry", x)))))))))))))
  
  return(x)
  
}

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
  ## replace NA by zero
  x <- x %>% mutate(across(everything(), .fns = ~replace_na(.,0))) 
  ## melt data
  x <- melt(x, value.name= "pixel_count", id.vars =c("NOME", "SEQUENCIA", "design", "mapb_year", "ref_class"))
  
  return(x)
}

## Filter table
data <- filterTab(table = data)

## Convert IDs to string names
data$variable <- setClasses(list = data$variable)

## Rect ecoregion names
data$NOME <- setNames(list = data$NOME)

## Subset data for each design
d1 <- subset(data, design == "1")
d2 <- subset(data, design == "2" & variable == "Grassland" | variable == "Forest")

## Plot for design 1
ggplot(d1, aes(x= reorder(variable, pixel_count), y= pixel_count/1000000, fill = variable)) +
  geom_bar(stat="identity") +
  scale_fill_manual(values=c("#006400", "#935132", "#B8AF4F", "#af2a2a", "#fff3bf", "#FF99FF", "#FFD966", "#f3b4f1", "#FF8C00", "#32CD32", "#C27BA0", "#D5A6BD", "#0000FF")) +
  facet_wrap(~NOME) +
  coord_flip() +
  theme_bw() +
  theme(axis.text.x = element_text(angle = 90, vjust = 0.5, hjust=1)) +
  xlab("Mapbiomas class") + ylab ("Pixel count x 1Mi")

## Plot for design 2        
ggplot(d2, aes(x= reorder(variable, pixel_count), y= pixel_count/1000000, fill= variable)) +
  geom_bar(stat="identity") +
  scale_fill_manual(values=c("#006400", "#B8AF4F")) +
  facet_wrap(~NOME) +
  coord_flip() +
  theme_bw() +
  theme(axis.text.x = element_text(angle = 90, vjust = 0.5, hjust=1)) +
  xlab("Mapbiomas class") + ylab ("Pixel count x 1Mi")

