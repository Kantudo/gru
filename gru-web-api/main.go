package main

import (
	"fmt"

	"github.com/gin-gonic/gin"
)

type imgData struct {
	Img [][]int `json:"img"`
}

func postImg(c *gin.Context) {

	var img imgData

	if err := c.BindJSON(&img); err != nil {
		// fmt.Println("error")
		fmt.Println(err)
		return
	}

	fmt.Println(img.Img)

	// fmt.Print(img)
	// body, _ := ioutil.ReadAll(c.Request.Body)
	// println(string(img))
}

func main() {
	router := gin.Default()
	router.POST("/img", postImg)

	router.Run("localhost:8080")
}
