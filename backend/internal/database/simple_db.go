package database

import (
	"database/sql"
	"fmt"
	"log"

	_ "github.com/lib/pq"
)

type SimpleDB struct {
	db *sql.DB
}

func NewSimpleDB(databaseURL string) (*SimpleDB, error) {
	db, err := sql.Open("postgres", databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Test the connection
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	log.Println("Successfully connected to PostgreSQL database")
	return &SimpleDB{db: db}, nil
}

func (s *SimpleDB) Close() error {
	return s.db.Close()
}

func (s *SimpleDB) GetDB() *sql.DB {
	return s.db
}

func (s *SimpleDB) HealthCheck() error {
	return s.db.Ping()
}
